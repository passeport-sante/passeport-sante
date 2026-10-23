import { AccessibilityPanel } from "@/components/a11y/AccessibilityPanel";
import { ConsignePanel } from "@/components/a11y/ConsignePanel";

export default function ModuleViewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ConsignePanel />
      <AccessibilityPanel />
    </>
  );
}
