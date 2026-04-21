"use client";

import { useEffect } from "react";
import { useRive } from "@rive-app/react-canvas";
import type { Rive as RiveType } from "@rive-app/canvas";

interface Props {
  level: 1 | 2 | 3 | 4 | 5;
  src?: string;
  width?: number;
  height?: number;
}

function setRiveLevel(rive: RiveType, level: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = rive as any;

  // Récupère ou crée un ViewModelInstance et le binde à l'artboard
  function getOrCreateVMI() {
    // 1. Instance déjà bindée automatiquement au chargement
    if (r.viewModelInstance) return r.viewModelInstance;

    // 2. defaultViewModel() est sur l'instance Rive, pas sur l'artboard
    const vm =
      r.defaultViewModel?.() ??
      r.viewModelByName?.("GameProgressController") ??
      r.viewModelByIndex?.(0);

    if (!vm) return null;

    const vmi = vm.defaultInstance?.() ?? vm.instance?.() ?? vm.instanceByIndex?.(0);
    if (!vmi) return null;

    r.bindViewModelInstance?.(vmi);
    return vmi;
  }

  const vmi = getOrCreateVMI();

  if (!vmi) {
    console.warn("❌ ViewModelInstance introuvable");
    return;
  }

  const prop = vmi.number?.("level");
  if (!prop) {
    console.warn("❌ Propriété 'level' introuvable sur le VMI. Props dispo :", vmi);
    return;
  }

  prop.value = level;
  console.log("✅ level →", level);
}

export function GameProgress({ level, src = "/assets/rive/progressbar_vaccination.riv", width = 750, height = 320 }: Props) {
  const { rive, RiveComponent } = useRive({
    src,
    artboard: "GameProgress",
    stateMachines: "State Machine 1",
    autoplay: true,
  });

  useEffect(() => {
    if (!rive) return;
    setRiveLevel(rive, level);
  }, [rive, level]);

  return <RiveComponent style={{ width, height }} />;
}
