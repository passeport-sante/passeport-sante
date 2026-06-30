"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FlowStep } from "@/lib/step-flow";

interface Props {
  slug: string;
  steps: FlowStep[];
  order: number;
  children: React.ReactNode;
}

// Empêche l'accès direct (URL tapée à la main, etc.) à une étape de jeu
// dont le niveau n'est pas encore débloqué dans la progression du joueur.
export function StepGate({ slug, steps, order, children }: Props) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const gameSteps = [...steps].filter((s) => s.kind === "GAME").sort((a, b) => a.order - b.order);
    const rank = gameSteps.findIndex((s) => s.order === order) + 1;

    // Étape de contenu intercalée (pas de verrou affiché sur la carte) : toujours accessible
    if (rank === 0) {
      setAllowed(true);
      return;
    }

    const stored = parseInt(localStorage.getItem(`module_level_${slug}`) ?? "1", 10);
    const unlocked = Math.min(Math.max(stored, 1), Math.max(gameSteps.length, 1));

    if (rank <= unlocked) {
      setAllowed(true);
    } else {
      router.replace(`/modules/${slug}`);
    }
  }, [slug, steps, order, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
