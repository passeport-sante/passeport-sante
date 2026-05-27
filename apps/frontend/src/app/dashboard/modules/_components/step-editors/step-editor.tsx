"use client";

import type { AdminStep, AdminGameData } from "@/lib/steps-admin";
import { KanbanEditor } from "./kanban-editor";
import { QuizEditor } from "./quiz-editor";
import { ScenarioEditor } from "./scenario-editor";
import { PhraseEditor } from "./phrase-editor";
import { PuzzleEditor } from "./puzzle-editor";

interface Props {
  step: AdminStep;
  color: string;
  onSave: (payload: {
    content: { title?: string; instructions?: string };
    gameData: AdminGameData[];
  }) => Promise<void>;
}

export function StepEditor(props: Props) {
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
