"use client";

import { QuestionOuiNon }  from "./question-oui-non";
import { QuestionMcq }     from "./question-mcq";
import { QuestionMcqMulti } from "./question-mcq-multi";
import { QuestionSlider }  from "./question-slider";
import { QuestionClassify } from "./question-classify";
import type { Question }   from "@/lib/diagnostic";

type Props = {
  question: Question;
  answer: unknown;
  onAnswer: (value: unknown) => void;
  onToggle: (id: string) => void;
  onClassifyValidate: (result: Record<string, any>) => void;
};

export function QuestionRenderer({
  question,
  answer,
  onAnswer,
  onToggle,
  onClassifyValidate,
}: Props) {
  const choices = question.options?.choices ?? [];

  switch (question.questionType) {
    case "TRUE_FALSE":
      return (
        <QuestionOuiNon
          question={question.questionText}
          selected={
            answer === undefined ? null :
            (answer as Record<string, any>)?.answer === choices[0] ? true : false
          }
          onAnswer={(val) => onAnswer({ answer: val ? choices[0] : choices[1] })}
        />
      );

    case "MCQ":
      return (
        <QuestionMcq
          question={question.questionText}
          options={choices.map((c: string) => ({ id: c, label: c }))}
          selected={(answer as Record<string, any> | undefined)?.answer ?? null}
          onSelect={(id) => onAnswer({ answer: id })}
        />
      );

    case "MCQ_MULTI":
      return (
        <QuestionMcqMulti
          question={question.questionText}
          options={choices.map((c: string) => ({ id: c, label: c }))}
          selected={(answer as string[]) ?? []}
          onToggle={onToggle}
        />
      );

    case "OPEN":
      return (
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
          <div
            className="bg-[#1A527A] rounded-2xl px-10 py-7 w-full text-center"
            style={{ boxShadow: "0 0 40px rgba(78,175,90,0.35), 0 8px 32px rgba(0,0,0,0.25)" }}
          >
            <p className="text-2xl font-black text-white">{question.questionText}</p>
          </div>
          <input
            type="text"
            value={(answer as Record<string, any> | undefined)?.answer ?? ""}
            onChange={(e) => onAnswer({ answer: e.target.value })}
            placeholder="Ta réponse…"
            className="w-full bg-white/10 border-2 border-white/20 focus:border-[#4CAF5A] outline-none rounded-2xl px-6 py-4 text-white text-lg placeholder:text-white/30 transition-colors"
          />
        </div>
      );

    case "CLASSIFY":
      return (
        <div className="w-full">
          <QuestionClassify
            title="VRAI ou FAUX ?"
            subtitle="Glisse les cartes dans la bonne colonne"
            items={(question.options?.items ?? []).map((i: any) => ({ id: i.id, text: i.text }))}
            onValidate={onClassifyValidate}
          />
        </div>
      );

    default:
      return null;
  }
}
