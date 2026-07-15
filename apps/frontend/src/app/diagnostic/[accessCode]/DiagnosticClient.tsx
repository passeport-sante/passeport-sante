"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
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
import { DiagnosticCertificatePdf } from "./DiagnosticCertificatePdf";

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
  const [pdfMounted, setPdfMounted] = useState(false);
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

  // ── PDF mount guard (react-pdf needs browser APIs) ─────────────────────────

  useEffect(() => { if (done) setPdfMounted(true); }, [done]);

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

  if (done) {
    const today = new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div
          className="bg-[#0F3A5C]/80 backdrop-blur-sm rounded-3xl p-6 sm:p-12 text-center text-white max-w-sm flex flex-col items-center"
          style={{ boxShadow: "0 0 60px rgba(78,175,90,0.25)" }}
        >
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-3xl font-black mb-3">Bravo !</h2>
          <p className="text-white/70">Tu as répondu à toutes les questions.</p>

          <div className="flex flex-col gap-3 mt-8 w-full">
            {pdfMounted ? (
              <PDFDownloadLink
                document={
                  <DiagnosticCertificatePdf
                    className={session.className}
                    date={today}
                    questionCount={questions.length}
                  />
                }
                fileName={`diagnostic-sante-${session.className.replace(/\s+/g, "-").toLowerCase()}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#0F3A5C] font-bold rounded-2xl hover:bg-white/90 transition-opacity">
                    {pdfLoading
                      ? <><Loader2 size={16} className="animate-spin" /> Génération…</>
                      : <><Download size={16} /> Télécharger mon attestation</>
                    }
                  </button>
                )}
              </PDFDownloadLink>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/20 text-white/50 font-bold rounded-2xl">
                <Loader2 size={16} className="animate-spin" />
                Préparation du PDF…
              </div>
            )}

            <button
              onClick={() => router.push("/")}
              className="text-white/60 hover:text-white text-sm underline transition-colors"
            >
              Retour à l&apos;accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Rendu principal ────────────────────────────────────────────────────────

  const question   = questions[index]!;
  const answer     = answers[index];
  const isClassify = question?.questionType === "CLASSIFY";

  const canNext =
    question?.questionType === "MCQ_MULTI" ? ((answer as string[] | undefined)?.length ?? 0) > 0 :
    question?.questionType === "OPEN"      ? true :
    answer !== undefined;

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-10">
        <ProgressCard current={index + 1} total={questions.length} exitHref="/diagnostic" />
      </div>

      <div className="flex-1 flex items-center justify-center overflow-y-auto min-h-0 pt-20 pb-24 md:py-20">
        <QuestionRenderer
          question={question}
          answer={answer}
          onAnswer={setAnswer}
          onToggle={toggleMulti}
          onClassifyValidate={(result) => { setAnswer(result); next(); }}
        />
      </div>

      {!isClassify && (
        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-10">
          <NextButton onClick={next} disabled={!canNext} />
        </div>
      )}
    </div>
  );
}
