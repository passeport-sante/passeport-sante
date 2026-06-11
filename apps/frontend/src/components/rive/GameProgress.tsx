"use client";

import { useEffect, useRef } from "react";
import { useRive } from "@rive-app/react-canvas";
import type { Rive as RiveType } from "@rive-app/canvas";

interface Props {
  level: 1 | 2 | 3 | 4 | 5;
  src?: string;
  width?: number;
  height?: number;
  /** Couleur principale des steps débloqués (hex, ex: "#1B6B8A") */
  stepColor?: string;
  /** Fichier de mascotte à injecter dans le .riv, ex: "mascotte1.png" */
  mascotteFile?: string;
}

function hexToRgba(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: 255,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getOrCreateVMI(r: any) {
  if (r.viewModelInstance) return r.viewModelInstance;
  const vm =
    r.defaultViewModel?.() ??
    r.viewModelByName?.("GameProgressController") ??
    r.viewModelByIndex?.(0);
  if (!vm) {
    console.warn("[GameProgress] JS: no ViewModel found on artboard");
    return null;
  }
  const vmi = vm.defaultInstance?.() ?? vm.instance?.() ?? vm.instanceByIndex?.(0);
  if (!vmi) {
    console.warn("[GameProgress] JS: ViewModel found but no instance");
    return null;
  }
  r.bindViewModelInstance?.(vmi);
  return vmi;
}

function setRiveLevel(rive: RiveType, level: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = rive as any;
  const vmi = getOrCreateVMI(r);
  if (!vmi) return;
  const prop = vmi.number?.("level");
  if (!prop) return;
  prop.value = level;
  // Force labels visible for completed steps (state machine hides them in completed state)
  for (let s = 2; s <= 5; s++) {
    if (s >= level) break;
    const labelProp = vmi.number?.(`label${s}Opacity`);
    if (labelProp) labelProp.value = 1;
  }
  // Move the embedded walking character off-screen — the HTML overlay handles mascotte display
  const charX = vmi.number?.("characterX");
  if (charX) charX.value = -9999;
}

function lighten(c: { r: number; g: number; b: number; a: number }, t = 0.35) {
  return {
    r: Math.round(c.r + (255 - c.r) * t),
    g: Math.round(c.g + (255 - c.g) * t),
    b: Math.round(c.b + (255 - c.b) * t),
    a: 255,
  };
}

// Rive stores colors as packed ARGB integers, not {r,g,b,a} objects
function toArgb(c: { r: number; g: number; b: number; a: number }): number {
  return (((c.a << 24) | (c.r << 16) | (c.g << 8) | c.b) >>> 0) as number;
}

function setColor(prop: any, c: { r: number; g: number; b: number; a: number }) {
  prop.value = toArgb(c);
}

function setRiveStepColor(rive: RiveType, hex: string, level: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = rive as any;
  const vmi = getOrCreateVMI(r);
  if (!vmi) return;
  const base = hexToRgba(hex);
  const stepColor = vmi.color?.("stepColor");
  if (stepColor) setColor(stepColor, base);
  void level;
}

export function GameProgress({
  level,
  src = "/assets/rive/progressbar_default_enchenced.riv",
  width = 750,
  height = 320,
  stepColor,
  mascotteFile,
}: Props) {
  const initialized = useRef(false);
  const currentLevel = useRef(level);

  const { rive, RiveComponent } = useRive({
    src,
    artboard: "GameProgress",
    stateMachines: "State Machine 1",
    autoplay: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assetLoader: (asset: any, _bytes: any) => {
      if (!asset.isImage) return false;

      if (asset.name === "mascotte-a") {
        if (mascotteFile) {
          fetch(`/assets/mascotte/${mascotteFile}`)
            .then((r) => r.arrayBuffer())
            .then((buf) => asset.decode(new Uint8Array(buf)));
        } else {
          // Transparent 1×1 PNG to hide the default embedded character
          const c = document.createElement("canvas");
          c.width = 1; c.height = 1;
          c.toBlob((blob) => {
            blob?.arrayBuffer().then((buf) => asset.decode(new Uint8Array(buf)));
          }, "image/png");
        }
        return true;
      }

      // For all other image assets (cadenas etc.): re-decode their embedded bytes
      // so returning true doesn't cause Rive to skip them
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const embedded: Uint8Array | undefined = (asset as any).bytes;
      if (embedded && embedded.length > 0) {
        asset.decode(embedded);
        return true;
      }
      return false;
    },
  });

  useEffect(() => {
    if (!rive || initialized.current) return;
    initialized.current = true;
    currentLevel.current = level;
    rive.play();
    setRiveLevel(rive, level);
    // Re-apply after first state machine frame to override any transition resets
    const rafId = requestAnimationFrame(() => {
      setRiveLevel(rive, level);
      if (stepColor) setRiveStepColor(rive, stepColor, level);
    });
    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rive]);

  useEffect(() => {
    if (!rive || !initialized.current || !stepColor) return;
    setRiveStepColor(rive, stepColor, level);
  }, [rive, stepColor, level]);

  // Changement de level
  useEffect(() => {
    if (!rive || !initialized.current) return;
    if (currentLevel.current === level) return;
    currentLevel.current = level;
    setRiveLevel(rive, level);
    // Re-apply after transition completes to override any animation resets on labels
    const t = setTimeout(() => setRiveLevel(rive, level), 800);
    return () => clearTimeout(t);
  }, [rive, level]);

  return <RiveComponent style={{ width, height }} />;
}
