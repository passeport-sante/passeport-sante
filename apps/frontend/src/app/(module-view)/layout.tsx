import { AccessibilityPanel } from "@/components/a11y/AccessibilityPanel";

export default function ModuleViewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AccessibilityPanel />
    </>
  );
}
