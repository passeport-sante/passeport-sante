import { PieChart } from "./pie-chart";
import type { QuestionStats } from "@/lib/dashboard";

const TYPE_LABEL: Record<string, string> = {
  TRUE_FALSE: "Vrai / Faux",
  MCQ: "Choix unique",
  MCQ_MULTI: "Choix multiple",
  CLASSIFY: "Classement",
  OPEN: "Ouverte",
};

const WRONG_COLORS   = ["#EF4444", "#F97316", "#8B5CF6", "#EC4899", "#0EA5E9", "#F59E0B"];
// Palette used when no correctAnswer exists (survey questions)
const SURVEY_PALETTE = ["#1B6B8A", "#2A8970", "#6366F1", "#F97316", "#EC4899", "#0EA5E9", "#F59E0B", "#10B981"];

interface Props {
  stats: QuestionStats;
  index: number;
}

export function QuestionResultCard({ stats, index }: Props) {
  const { question, totalAnswered, slices } = stats;
  const isOpen = question.questionType === "OPEN";

  // Si toutes les slices ont isCorrect === null → question sondage, on utilise la palette colorée
  const isSurvey = slices.length > 0 && slices.every((s) => s.isCorrect === null);

  let wrongIdx = 0;
  const slicesWithColor = slices.map((s, i) => {
    if (isSurvey) return { ...s, color: SURVEY_PALETTE[i % SURVEY_PALETTE.length] ?? "#9CA3AF" };
    if (s.isCorrect === true) return { ...s, color: "#2A8970" };
    if (s.isCorrect === false) return { ...s, color: WRONG_COLORS[wrongIdx++ % WRONG_COLORS.length] ?? "#EF4444" };
    return { ...s, color: "#9CA3AF" };
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex gap-5">
      {/* Left — question + answer list */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Badge type */}
        <div className="flex items-center gap-2">
          <span className="inline-block px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider"
            style={{ background: "#EBF4F8", color: "#1B6B8A" }}>
            Question {index}
          </span>
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-400 uppercase tracking-wider">
            {TYPE_LABEL[question.questionType] ?? question.questionType}
          </span>
        </div>

        {/* Question text */}
        <p className="text-sm font-bold text-[#1A1A1A] leading-snug">
          {question.questionText}
        </p>

        {/* Answer options */}
        {isOpen ? (
          <p className="text-xs text-gray-400 italic">
            {totalAnswered} réponse{totalAnswered > 1 ? "s" : ""} libre{totalAnswered > 1 ? "s" : ""} — non notée{totalAnswered > 1 ? "s" : ""}
          </p>
        ) : slices.length === 0 ? (
          <p className="text-xs text-gray-400">Aucune réponse</p>
        ) : (
          <div className="space-y-1.5">
            {slicesWithColor.map((s) => {
              const pct = totalAnswered > 0 ? Math.round((s.count / totalAnswered) * 100) : 0;
              return (
                <div key={s.label} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ background: `${s.color}12` }}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-gray-700 flex-1 leading-tight">{s.label}</span>
                  <span className="text-xs font-bold ml-auto shrink-0" style={{ color: s.color }}>
                    {pct}%
                  </span>
                  <span className="text-xs text-gray-400 shrink-0 w-10 text-right">
                    ({s.count})
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-400">{totalAnswered} réponse{totalAnswered > 1 ? "s" : ""} au total</p>
      </div>

      {/* Right — pie chart */}
      {!isOpen && (
        <div className="shrink-0 flex items-center">
          <PieChart slices={slicesWithColor} size={110} />
        </div>
      )}
    </div>
  );
}
