"use client";

import type { AdminStep, AdminGameData, StepContent } from "@/lib/steps-admin";
import { KanbanEditor } from "./kanban-editor";
import { QuizEditor } from "./quiz-editor";
import { ScenarioEditor } from "./scenario-editor";
import { PhraseEditor } from "./phrase-editor";
import { PuzzleEditor } from "./puzzle-editor";
import { ContentEditor } from "./content-editor";

interface Props {
  step: AdminStep;
  color: string;
  onSave: (payload: {
    content: StepContent;
    gameData?: AdminGameData[];
  }) => Promise<void>;
}

export function StepEditor(props: Props) {
  if (props.step.kind === "CONTENT") {
    return <ContentEditor {...props} />;
  }

  switch (props.step.gameType) {
    case "KANBAN":
      return <KanbanEditor {...props} />;
    case "QUIZ":
      return <QuizEditor {...props} />;
    case "SCENARIO":
      return <ScenarioEditor {...props} />;
    case "PHRASE_A_TROU":
      return <PhraseEditor {...props} />;
    case "PUZZLE":
      return <PuzzleEditor {...props} />;
    default:
      return (
        <div className="bg-white rounded-2xl p-6 text-sm text-gray-500">
          Type d&apos;étape inconnu : {props.step.gameType}
        </div>
      );
  }
}
