"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FlowStep } from "@/lib/step-flow";
import { ensureGuestStudentId, fetchProgress } from "@/lib/modules";

interface Props {
  slug: string;
  moduleId: string;
  steps: FlowStep[];
  order: number;
  children: React.ReactNode;
}

// Empêche l'accès direct (URL tapée à la main, etc.) à une étape de jeu
// dont le niveau n'est pas encore débloqué dans la progression du joueur.
//
// C'est le serveur qui dit où en est l'élève : modifier `module_level_<slug>`
// dans le stockage local n'ouvre plus rien. Le stockage local ne sert que de
// repli quand le serveur est injoignable, pour ne pas bloquer une séance en
// cours sur un simple incident réseau.
export function StepGate({ slug, moduleId, steps, order, children }: Props) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let annule = false;

    async function verifier() {
      const gameSteps = [...steps]
        .filter((s) => s.kind === "GAME")
        .sort((a, b) => a.order - b.order);
      const rank = gameSteps.findIndex((s) => s.order === order) + 1;

      // Étape de contenu intercalée (pas de verrou affiché sur la carte) :
      // toujours accessible.
      if (rank === 0) {
        setAllowed(true);
        return;
      }

      // Un élève qui arrive directement sur une étape (lien partagé, retour en
      // arrière) n'a pas forcément été identifié par la carte du module.
      const guestStudentId = await ensureGuestStudentId(slug);
      const etat = guestStudentId ? await fetchProgress(guestStudentId, moduleId) : null;
      if (annule) return;

      const local = parseInt(localStorage.getItem(`module_level_${slug}`) ?? "1", 10);
      const brut = etat ? etat.unlockedLevel : local;
      const unlocked = Math.min(Math.max(brut, 1), Math.max(gameSteps.length, 1));

      if (rank <= unlocked) setAllowed(true);
      else router.replace(`/modules/${slug}`);
    }

    void verifier();
    return () => {
      annule = true;
    };
  }, [slug, moduleId, steps, order, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
