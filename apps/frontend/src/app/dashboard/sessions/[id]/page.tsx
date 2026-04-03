"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import {
  fetchSessionDetail,
  computeQuestionStats,
  computeAvgScore,
} from "@/lib/dashboard";
import type { SessionDetail } from "@/lib/dashboard";
import { ScoreCard } from "./_components/score-card";
import { QuestionResultCard } from "./_components/question-result-card";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { FileDown } from "lucide-react";
import { SessionPdfDocument } from "./_components/SessionPdfDocument";

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token") ?? "";
    fetchSessionDetail(id, token)
      .then((data) => {
        if (!data) router.replace("/dashboard");
        else setSession(data);
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const avgScore = computeAvgScore(session.diagnosticResponses);
  const excellence = session.diagnosticResponses.filter(
    (r) => r.isCorrect === true,
  ).length;
  const totalGraded = session.diagnosticResponses.filter(
    (r) => r.isCorrect !== null,
  ).length;
  const excellencePct =
    totalGraded > 0 ? Math.round((excellence / totalGraded) * 100) : 0;
  const questionStats = computeQuestionStats(session.diagnosticResponses);

  return (
    <div className="p-8 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard"
          className="mt-1 p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[#1A1A1A]">
            {session.className}
          </h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {new Date(session.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              {session._count.guestStudents} élève
              {session._count.guestStudents > 1 ? "s" : ""}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                session.isActive
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {session.isActive ? "Active" : "Terminée"}
            </span>
            <PDFDownloadLink
              document={
                <SessionPdfDocument
                  session={session}
                  questionStats={questionStats}
                  avgScore={avgScore}
                />
              }
              fileName={`resultats-${session.className.replace(/\s+/g, "-")}-${session.accessCode}.pdf`}
            >
              {({ loading: pdfLoading }) => (
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                  style={{
                    background: pdfLoading ? "#F3F4F6" : "#EBF4F8",
                    color: pdfLoading ? "#9CA3AF" : "#1B6B8A",
                  }}
                >
                  <FileDown size={14} />
                  {pdfLoading ? "Génération..." : "Exporter PDF"}
                </button>
              )}
            </PDFDownloadLink>
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            Code
          </p>
          <p className="font-mono font-black text-[#1B6B8A] tracking-widest text-sm">
            {session.accessCode}
          </p>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-4 gap-4">
        <ScoreCard
          label="Participants"
          value={session._count.guestStudents}
          sub="élèves ont rejoint"
          color="#1B6B8A"
        />
        <ScoreCard
          label="Réponses collectées"
          value={session._count.diagnosticResponses}
          sub="sur l'ensemble des questions"
          color="#2A8970"
        />
        <ScoreCard
          label="Score moyen"
          value={`${avgScore}%`}
          sub="des réponses sont correctes"
          color="#4CAF5A"
        />
        <ScoreCard
          label="Excellence"
          value={`${excellencePct}%`}
          sub="réponses correctes (avec pondération)"
          color="#6366F1"
        />
      </div>

      {/* Per-question results */}
      {questionStats.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">
            Résultats par question
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
              {questionStats.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {questionStats.map((qs, i) => (
              <QuestionResultCard
                key={qs.question.id}
                stats={qs}
                index={i + 1}
              />
            ))}
          </div>
        </section>
      )}

      {session.diagnosticResponses.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-gray-400">
            Aucune réponse enregistrée pour cette session.
          </p>
        </div>
      )}
    </div>
  );
}
