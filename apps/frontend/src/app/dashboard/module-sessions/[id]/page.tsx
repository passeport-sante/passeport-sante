"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Users, CheckCircle2, XCircle, FileDown } from "lucide-react";
import {
  fetchModuleSessionDetail,
  computeModuleStepStats,
  closeModuleSession,
} from "@/lib/dashboard";
import type { ModuleSessionDetail, StepStats } from "@/lib/dashboard";
import { ScoreCard } from "../../sessions/[id]/_components/score-card";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ModuleSessionPdfDocument } from "./_components/ModuleSessionPdfDocument";

const GAME_TYPE_LABEL: Record<string, string> = {
  KANBAN:      "Trie les éléments",
  PHRASE_A_TROU: "Phrase à trou",
  PUZZLE:      "Puzzle",
  SCENARIO:    "Mise en situation",
  QUIZ:        "Quiz final",
  MOTS_CROISES: "Mots croisés",
};

export default function ModuleSessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<ModuleSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token") ?? "";
    fetchModuleSessionDetail(id, token)
      .then((data) => {
        if (!data) router.replace("/dashboard");
        else setSession(data);
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleClose() {
    if (!session) return;
    setClosing(true);
    const token = localStorage.getItem("access_token") ?? "";
    await closeModuleSession(session.id, token);
    setSession((s) => s ? { ...s, isActive: false } : s);
    setClosing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const stepStats = computeModuleStepStats(session);
  const totalStudents = session._count.guestStudents;
  const totalResponses = stepStats.reduce((s, st) => s + st.totalAttempts, 0);
  const avgSuccess = stepStats.filter((s) => s.totalAttempts > 0).length > 0
    ? Math.round(stepStats.filter((s) => s.totalAttempts > 0).reduce((s, st) => s + st.successRate, 0) / stepStats.filter((s) => s.totalAttempts > 0).length)
    : 0;
  const color = session.module?.colorPrimary ?? "#1B6B8A";

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
          <h1 className="text-2xl font-black text-[#1A1A1A]">{session.className}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {new Date(session.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              {totalStudents} élève{totalStudents > 1 ? "s" : ""}
            </span>
            {session.module ? (
              <span
                className="font-semibold text-xs px-2.5 py-1 rounded-full"
                style={{ background: `${color}18`, color }}
              >
                {session.module.title}
              </span>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 italic">
                Module supprimé
              </span>
            )}
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                session.isActive
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {session.isActive ? "Active" : "Terminée"}
            </span>
            {session.isActive && (
              <button
                onClick={handleClose}
                disabled={closing}
                className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {closing ? "Clôture…" : "Clôturer la session"}
              </button>
            )}
            <PDFDownloadLink
              document={
                <ModuleSessionPdfDocument
                  session={session}
                  stepStats={stepStats}
                  avgSuccess={avgSuccess}
                  totalResponses={totalResponses}
                />
              }
              fileName={`resultats-module-${session.className.replace(/\s+/g, "-")}-${session.accessCode}.pdf`}
            >
              {({ loading: pdfLoading }) => (
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                  style={{
                    background: pdfLoading ? "#F3F4F6" : `${color}18`,
                    color: pdfLoading ? "#9CA3AF" : color,
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
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Code</p>
          <p className="font-mono font-black tracking-widest text-sm" style={{ color }}>
            {session.accessCode}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <ScoreCard
          label="Participants"
          value={totalStudents}
          sub="élèves ont rejoint"
          color={color}
        />
        <ScoreCard
          label="Réponses enregistrées"
          value={totalResponses}
          sub="toutes activités confondues"
          color="#2A8970"
        />
        <ScoreCard
          label="Taux de réussite moyen"
          value={`${avgSuccess}%`}
          sub="sur les activités notées"
          color="#4CAF5A"
        />
      </div>

      {/* Par étape */}
      {stepStats.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">
            Résultats par étape
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
              {stepStats.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {stepStats.map((stats) => (
              <StepResultCard key={stats.step.id} stats={stats} color={color} />
            ))}
          </div>
        </section>
      )}

      {totalResponses === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-gray-400">Aucune réponse enregistrée pour cette session.</p>
        </div>
      )}
    </div>
  );
}

function StepResultCard({ stats, color }: { stats: StepStats; color: string }) {
  const { step, totalAttempts, correctCount, incorrectCount, successRate } = stats;
  const hasData = totalAttempts > 0;
  const gameLabel = GAME_TYPE_LABEL[step.gameType] ?? step.gameType;
  const stepTitle = (step.content as { title?: string } | null)?.title;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: `${color}18`, color }}
            >
              Étape {step.order}
            </span>
            <span className="text-xs text-gray-400 font-semibold">{gameLabel}</span>
          </div>
          {stepTitle && (
            <p className="font-bold text-[#1A1A1A] text-sm">{stepTitle}</p>
          )}
        </div>
        {hasData && (
          <span className="text-2xl font-black" style={{ color }}>
            {successRate}%
          </span>
        )}
      </div>

      {hasData ? (
        <>
          {/* Barre de progression */}
          <div className="space-y-1">
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${successRate}%`, background: `linear-gradient(90deg, ${color}, #4CAF5A)` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{totalAttempts} tentative{totalAttempts > 1 ? "s" : ""}</span>
              <span>{successRate}% de réussite</span>
            </div>
          </div>

          {/* Correct / Incorrect */}
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 size={15} />
              <span className="font-semibold">{correctCount}</span>
              <span className="text-gray-400">correct{correctCount > 1 ? "s" : ""}</span>
            </div>
            <div className="h-4 w-px bg-gray-200 self-center" />
            <div className="flex items-center gap-1.5 text-sm text-red-400">
              <XCircle size={15} />
              <span className="font-semibold">{incorrectCount}</span>
              <span className="text-gray-400">incorrect{incorrectCount > 1 ? "s" : ""}</span>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400 italic">Aucune réponse pour cette étape.</p>
      )}
    </div>
  );
}
