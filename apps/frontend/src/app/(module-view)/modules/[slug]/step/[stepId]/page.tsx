import { notFound } from "next/navigation";
import { PuzzleGame } from "./_components/PuzzleGame";
import { PhraseATrou } from "./_components/PhraseATrou";
import { KanbanGame } from "./_components/KanbanGame";
import { ScenarioGame } from "./_components/ScenarioGame";
import { QuizGame } from "./_components/QuizGame";
import { MotsCroises } from "./_components/MotsCroises";
import { HistoireGame } from "./_components/HistoireGame";
import { DialogueGame } from "./_components/DialogueGame";
import { ContentPanel } from "./_components/ContentPanel";
import { StepGate } from "./_components/StepGate";

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

  const content =
    step.kind === "CONTENT" && !step.gameType ? (
      <ContentPanel step={step} />
    ) : step.gameType === "KANBAN" ? (
      <KanbanGame step={step} />
    ) : step.gameType === "SCENARIO" ? (
      <ScenarioGame step={step} />
    ) : step.gameType === "QUIZ" ? (
      <QuizGame step={step} />
    ) : step.gameType === "PUZZLE" ? (
      <PuzzleGame step={step} />
    ) : step.gameType === "HISTOIRE" ? (
      <HistoireGame step={step} />
    ) : step.gameType === "PHRASE_A_TROU" ? (
      <PhraseATrou step={step} />
    ) : step.gameType === "MOTS_CROISES" ? (
      <MotsCroises step={step} />
    ) : step.gameType === "DIALOGUE" ? (
      <DialogueGame step={step} />
    ) : (
      <div className="h-screen flex items-center justify-center text-gray-500 text-xl font-bold">
        Jeu {step.gameType} — à venir
      </div>
    );

  return (
    <StepGate slug={step.module.slug} steps={step.module.steps} order={step.order}>
      {content}
    </StepGate>
  );
}
