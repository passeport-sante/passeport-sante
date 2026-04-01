"use client";

import { useState } from "react";
import { ProgressCard } from "@/components/diagnostic/progress-card";
import { NextButton } from "@/components/diagnostic/next-button";
import { QuestionOuiNon } from "@/components/diagnostic/question-oui-non";
import { QuestionSlider } from "@/components/diagnostic/question-slider";
import { QuestionClassify } from "@/components/diagnostic/question-classify";
import { QuestionMcq } from "@/components/diagnostic/question-mcq";
import { QuestionMcqMulti } from "@/components/diagnostic/question-mcq-multi";

// ── Types ─────────────────────────────────────────────────────────────────────

type OuiNonQuestion   = { type: "oui-non"; question: string };
type SliderQuestion   = { type: "slider"; question: string; min?: number; max?: number; minLabel?: string; maxLabel?: string };
type ClassifyQuestion = { type: "classify"; title?: string; subtitle?: string; items: { id: string; text: string }[] };
type McqQuestion      = { type: "mcq"; question: string; options: { id: string; label: string }[] };
type McqMultiQuestion = { type: "mcq-multi"; question: string; options: { id: string; label: string }[] };

type Question = OuiNonQuestion | SliderQuestion | ClassifyQuestion | McqQuestion | McqMultiQuestion;

// ── Données de démo ───────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    type: "oui-non",
    question: "Y a-t-il des écrans dans ta chambre (téléphone, télévision, console de jeux…) ?",
  },
  {
    type: "mcq",
    question: "À quelle heure te couches-tu en semaine ?",
    options: [
      { id: "a", label: "Entre 20h – 21h" },
      { id: "b", label: "Entre 21h – 22h" },
      { id: "c", label: "Entre 22h – 23h" },
      { id: "d", label: "Après 23h" },
    ],
  },
  {
    type: "mcq",
    question: "En moyenne, combien d'heures dors-tu par nuit en semaine ?",
    options: [
      { id: "a", label: "Moins de 6h" },
      { id: "b", label: "6h – 8h" },
      { id: "c", label: "8h – 10h" },
    ],
  },
  {
    type: "mcq-multi",
    question: "Quels sont les bienfaits d'une activité physique ?",
    options: [
      { id: "a", label: "Aucune" },
      { id: "b", label: "Allongement de l'espérance de vie" },
      { id: "c", label: "Être de bonne humeur" },
      { id: "d", label: "Éviter la prise de poids" },
      { id: "e", label: "Avoir des copains" },
      { id: "f", label: "Ne pas trop manger" },
    ],
  },
  {
    type: "slider",
    question: "Évaluez votre niveau de fatigue",
    minLabel: "Reposé",
    maxLabel: "Épuisé",
  },
  {
    type: "classify",
    title: "VRAI ou FAUX ?",
    subtitle: "Glisse les cartes dans la bonne colonne",
    items: [
      { id: "1", text: "Le sommeil n'a aucun impact sur la vie quotidienne" },
      { id: "2", text: "Le sommeil favorise la croissance" },
      { id: "3", text: "Le sommeil favorise la concentration en classe" },
      { id: "4", text: "Trop dormir empêche d'être performant en sport" },
    ],
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DiagnosticDemoPage() {
  const [index, setIndex]   = useState(0);
  const [answers, setAnswers] = useState<Record<number, unknown>>({});
  const [done, setDone]     = useState(false);

  const question  = QUESTIONS[index];
  const answer    = answers[index];
  const total     = QUESTIONS.length;
  const isClassify = question?.type === "classify";

  const next = () => {
    if (index < total - 1) setIndex((i) => i + 1);
    else setDone(true);
  };

  const setAnswer = (value: unknown) =>
    setAnswers((a) => ({ ...a, [index]: value }));

  const toggleMulti = (id: string) => {
    const current = (answer as string[]) ?? [];
    const updated  = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    setAnswer(updated);
  };

  const canNext =
    question?.type === "mcq"       ? answer !== undefined :
    question?.type === "mcq-multi" ? (answer as string[] | undefined)?.length ?? 0 > 0 :
    question?.type === "oui-non"   ? answer !== undefined :
    question?.type === "slider"    ? true :
    false;

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-[#0F3A5C]/80 backdrop-blur-sm rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-black mb-4">Diagnostic terminé !</h2>
          <p className="text-white/70">Merci pour vos réponses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-8">
      {/* Progress card */}
      {!isClassify && (
        <div className="absolute top-8 left-8 z-10">
          <ProgressCard current={index + 1} total={total} exitHref="/modules" />
        </div>
      )}

      {/* Contenu centré */}
      <div className="flex-1 flex items-center justify-center">
        {question.type === "oui-non" && (
          <QuestionOuiNon
            question={question.question}
            selected={(answer as boolean | null) ?? null}
            onAnswer={setAnswer}
          />
        )}

        {question.type === "mcq" && (
          <QuestionMcq
            question={question.question}
            options={question.options}
            selected={(answer as string | null) ?? null}
            onSelect={setAnswer}
          />
        )}

        {question.type === "mcq-multi" && (
          <QuestionMcqMulti
            question={question.question}
            options={question.options}
            selected={(answer as string[]) ?? []}
            onToggle={toggleMulti}
          />
        )}

        {question.type === "slider" && (
          <QuestionSlider
            question={question.question}
            value={(answer as number) ?? 5}
            min={question.min}
            max={question.max}
            minLabel={question.minLabel}
            maxLabel={question.maxLabel}
            onChange={setAnswer}
          />
        )}

        {question.type === "classify" && (
          <div className="w-full">
            <QuestionClassify
              title={question.title}
              subtitle={question.subtitle}
              items={question.items}
              onValidate={(result) => { setAnswer(result); next(); }}
            />
          </div>
        )}
      </div>

      {/* Bouton suivant */}
      {!isClassify && (
        <div className="absolute bottom-8 right-8 z-10">
          <NextButton onClick={next} disabled={!canNext} />
        </div>
      )}
    </div>
  );
}
