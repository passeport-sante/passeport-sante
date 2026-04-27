"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressCard }       from "@/components/diagnostic/progress-card";
import { NextButton }         from "@/components/diagnostic/next-button";
import { QuestionRenderer }   from "@/components/diagnostic/question-renderer";
import {
  fetchQuestions,
  createGuestStudent,
  submitResponse,
  type DiagnosticSession,
  type Question,
} from "@/lib/diagnostic";

type Props = {
  session: DiagnosticSession;
};

export default function DiagnosticClient({ session }: Props) {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [guestId, setGuestId]     = useState<string>("");
  const [index, setIndex]         = useState(0);
  const [answers, setAnswers]     = useState<Record<number, unknown>>({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const initDone = useRef(false);

  // ── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const init = async () => {
      try {
        const [qs, gId] = await Promise.all([
          fetchQuestions(),
          createGuestStudent(session.id),
        ]);
        setQuestions(qs);
        setGuestId(gId);
        setStartTime(Date.now());
      } catch (err: any) {
        setError(err.message ?? "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [session.id]);

  // ── Countdown ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!done) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); router.push("/"); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [done, router]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const setAnswer = (value: unknown) =>
    setAnswers((a) => ({ ...a, [index]: value }));

  const toggleMulti = (id: string) => {
    const current = (answers[index] as string[]) ?? [];
    const updated = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    setAnswer(updated);
  };

  const next = async () => {
    const question = questions[index]!;
    const answer   = answers[index];
    const timing   = Math.round((Date.now() - startTime) / 1000);

    const userAnswer: Record<string, any> =
      question.questionType === "MCQ_MULTI" ? { answers: answer as string[] } :
      question.questionType === "CLASSIFY"  ? answer as Record<string, any> :
      answer as Record<string, any>;

    await submitResponse({
      questionId:     question.id,
      userAnswer,
      guestStudentId: guestId,
      sessionId:      session.id,
      timing,
    });

    setStartTime(Date.now());
    if (index < questions.length - 1) setIndex((i) => i + 1);
    else setDone(true);
  };

  // ── États spéciaux ─────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-white text-xl font-bold animate-pulse">Chargement…</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="bg-[#0F3A5C]/80 rounded-3xl p-10 text-center text-white max-w-sm">
        <p className="text-xl font-black mb-4">⚠️ {error}</p>
        <button onClick={() => router.push("/diagnostic")} className="mt-4 underline text-white/70 hover:text-white text-sm">
          Retour
        </button>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="bg-[#0F3A5C]/80 backdrop-blur-sm rounded-3xl p-12 text-center text-white max-w-sm" style={{ boxShadow: "0 0 60px rgba(78,175,90,0.25)" }}>
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-3xl font-black mb-3">Bravo !</h2>
        <p className="text-white/70">Tu as répondu à toutes les questions.</p>
        <p className="text-white/40 text-sm mt-4">Redirection dans {countdown}s…</p>
      </div>
    </div>
  );

  // ── Rendu principal ────────────────────────────────────────────────────────

  const question   = questions[index]!;
  const answer     = answers[index];
  const isClassify = question?.questionType === "CLASSIFY";

  const canNext =
    question?.questionType === "MCQ_MULTI" ? ((answer as string[] | undefined)?.length ?? 0) > 0 :
    question?.questionType === "OPEN"      ? true :
    answer !== undefined;

  return (
    <div className="min-h-screen flex flex-col p-8">
      {!isClassify && (
        <div className="absolute top-8 left-8 z-10">
          <ProgressCard current={index + 1} total={questions.length} exitHref="/diagnostic" />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center">
        <QuestionRenderer
          question={question}
          answer={answer}
          onAnswer={setAnswer}
          onToggle={toggleMulti}
          onClassifyValidate={(result) => { setAnswer(result); next(); }}
        />
      </div>

      {!isClassify && (
        <div className="absolute bottom-8 right-8 z-10">
          <NextButton onClick={next} disabled={!canNext} />
        </div>
      )}
    </div>
  );
}
