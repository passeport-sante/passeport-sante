// Navigation enchaînée du parcours élève.
//
// La séquence d'un module mêle des étapes de jeu (kind="GAME", comptées et
// affichées comme cercles Rive) et des sous-étapes de contenu (kind="CONTENT",
// intercalées, non comptées). Le `order` est la position globale ; le « niveau »
// d'un jeu est dérivé de son rang parmi les seuls jeux.

import { completeStep, getGuestStudentId } from "@/lib/modules";

export interface FlowStep {
  id: string;
  order: number;
  kind: "GAME" | "CONTENT";
}

// Niveau de jeu courant (rang parmi les jeux) et nombre total de jeux.
// Pour un jeu : son propre rang. Pour un contenu : le rang du dernier jeu avant lui.
export function gameProgress(
  steps: FlowStep[],
  currentOrder: number,
): { level: number; total: number } {
  const gameSteps = steps.filter((s) => s.kind === "GAME");
  return {
    level: gameSteps.filter((s) => s.order <= currentOrder).length,
    total: gameSteps.length,
  };
}

// Avance vers l'item suivant de la séquence après avoir terminé l'étape courante
// (jeu validé ou contenu lu). Débloque le niveau de jeu suivant et navigue :
//  - prochain item CONTENT  → écran de contenu intercalé
//  - prochain item GAME      → retour à la carte immersive (animation depuis le niveau courant)
//  - plus d'item             → overlay de fin de module
export function goToNextStep(
  router: { push: (href: string) => void },
  slug: string,
  steps: FlowStep[],
  currentOrder: number,
): void {
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const { level: gameLevel, total: totalGameLevels } = gameProgress(sorted, currentOrder);
  const next = sorted.find((s) => s.order > currentOrder);

  // Le serveur fait foi : il n'ouvre le niveau suivant qu'après avoir vérifié
  // qu'une réponse a bien été enregistrée pour le jeu terminé. On ne l'attend
  // pas pour naviguer, la carte relit la progression à son affichage.
  const guestStudentId = getGuestStudentId(slug);
  const courant = sorted.find((s) => s.order === currentOrder);
  if (guestStudentId && courant) {
    void completeStep(guestStudentId, courant.id);
  }

  // Cache local, pour éviter un écran vide le temps de la réponse du serveur.
  // Il n'ouvre plus rien par lui-même : la carte et les étapes se fient au
  // serveur dès qu'il a répondu.
  const key = `module_level_${slug}`;
  const unlocked = Math.min(gameLevel + 1, Math.max(totalGameLevels, 1));
  const stored = parseInt(localStorage.getItem(key) ?? "1", 10);
  if (unlocked > stored) localStorage.setItem(key, String(unlocked));

  if (!next) {
    router.push(`/modules/${slug}?complete=true`);
  } else if (next.kind === "CONTENT") {
    router.push(`/modules/${slug}/step/${next.id}`);
  } else {
    router.push(`/modules/${slug}?from=${gameLevel}`);
  }
}
