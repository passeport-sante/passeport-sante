import { notFound } from "next/navigation";
import { PuzzleGame } from "./_components/PuzzleGame";
import { PhraseATrou } from "./_components/PhraseATrou";
import { KanbanGame } from "./_components/KanbanGame";
import { ScenarioGame } from "./_components/ScenarioGame";
import { QuizGame } from "./_components/QuizGame";
import { ContentPanel } from "./_components/ContentPanel";

async function getStep(stepId: string) {
  try {
    const base = process.env.API_INTERNAL_URL ?? "http://localhost:5000";
    const res = await fetch(`${base}/api/step/${stepId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function StepPage({
  params,
}: {
  params: Promise<{ slug: string; stepId: string }>;
}) {
  const { stepId } = await params;
  const step = await getStep(stepId);

  if (!step) notFound();

  if (step.kind === "CONTENT") return <ContentPanel step={step} />;

  if (step.gameType === "KANBAN") return <KanbanGame step={step} />;
  if (step.gameType === "SCENARIO") return <ScenarioGame step={step} />;
  if (step.gameType === "QUIZ") return <QuizGame step={step} />;
  if (step.gameType === "PUZZLE") return <PuzzleGame step={step} />;
  if (step.gameType === "PHRASE_A_TROU") return <PhraseATrou step={step} />;

  return (
    <div className="h-screen flex items-center justify-center text-gray-500 text-xl font-bold">
      Jeu {step.gameType} — à venir
    </div>
  );
}
