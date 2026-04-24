"use client";

import { useEffect, useRef } from "react";
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

  function getOrCreateVMI() {
    if (r.viewModelInstance) return r.viewModelInstance;
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
  if (!vmi) return;
  const prop = vmi.number?.("level");
  if (!prop) return;
  prop.value = level;
}

export function GameProgress({
  level,
  src = "/assets/rive/progressbar_vaccination.riv",
  width = 750,
  height = 320,
}: Props) {
  const initialized = useRef(false);
  const currentLevel = useRef(level);

  const { rive, RiveComponent } = useRive({
    src,
    artboard: "GameProgress",
    stateMachines: "State Machine 1",
    autoplay: false,
  });

  // Premier rendu : positionner sans animer, puis jouer
  useEffect(() => {
    if (!rive || initialized.current) return;
    initialized.current = true;
    currentLevel.current = level;
    setRiveLevel(rive, level);
    const t = setTimeout(() => rive.play(), 100);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rive]);

  // Changement de level (déclenché par le bouton "Étape suivante")
  useEffect(() => {
    if (!rive || !initialized.current) return;
    if (currentLevel.current === level) return;
    currentLevel.current = level;
    setRiveLevel(rive, level);
  }, [rive, level]);

  return <RiveComponent style={{ width, height }} />;
}
