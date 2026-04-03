import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { SessionDetail, QuestionStats } from "@/lib/dashboard";

const COLORS = {
  blue: "#1B6B8A",
  green: "#2A8970",
  lightBlue: "#EBF4F8",
  lightGreen: "#EBF6F3",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  dark: "#1A1A1A",
  white: "#FFFFFF",
  correct: "#2A8970",
  wrong: "#EF4444",
};

const SURVEY_PALETTE = [
  "#1B6B8A",
  "#2A8970",
  "#6366F1",
  "#F97316",
  "#EC4899",
  "#0EA5E9",
  "#F59E0B",
  "#10B981",
];
const WRONG_COLORS = ["#EF4444", "#F97316", "#8B5CF6", "#EC4899"];

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", backgroundColor: "#F8FAFC", padding: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandBlue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#2563EB" },
  brandGreen: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#2A8970" },
  headerRight: { alignItems: "flex-end" },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  pillText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  subtitle: { fontSize: 9, color: "#6B7280" },
  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  kpiCard: { flex: 1, borderRadius: 10, padding: 14 },
  kpiValue: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  kpiLabel: { fontSize: 7, color: "#6B7280", textTransform: "uppercase" },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardBadgeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
    alignItems: "center",
  },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 7, fontFamily: "Helvetica-Bold" },
  questionText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1A1A1A",
    marginBottom: 10,
    lineHeight: 1.4,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  barLabel: { fontSize: 7, color: "#374151", flex: 1 },
  barTrack: { height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, flex: 1 },
  barFill: { height: 6, borderRadius: 3 },
  barPct: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    width: 26,
    textAlign: "right",
  },
  barCount: { fontSize: 7, color: "#9CA3AF", width: 18, textAlign: "right" },
  totalText: { fontSize: 7, color: "#9CA3AF", marginTop: 6 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: "#9CA3AF" },
});

const TYPE_LABEL: Record<string, string> = {
  TRUE_FALSE: "Vrai / Faux",
  MCQ: "Choix unique",
  MCQ_MULTI: "Choix multiple",
  CLASSIFY: "Classement",
  OPEN: "Ouverte",
};

function getSliceColor(
  isCorrect: boolean | null,
  idx: number,
  isSurvey: boolean,
): string {
  if (isSurvey) return SURVEY_PALETTE[idx % SURVEY_PALETTE.length];
  if (isCorrect === true) return COLORS.correct;
  if (isCorrect === false) return WRONG_COLORS[idx % WRONG_COLORS.length];
  return "#9CA3AF";
}

function QuestionCard({ qs, index }: { qs: QuestionStats; index: number }) {
  const isOpen = qs.question.questionType === "OPEN";
  const isSurvey =
    qs.slices.length > 0 && qs.slices.every((s) => s.isCorrect === null);
  const total = qs.totalAnswered;

  let wrongIdx = 0;

  return (
    <View style={s.card} wrap={false}>
      {/* Badges */}
      <View style={s.cardBadgeRow}>
        <View style={[s.badge, { backgroundColor: "#EBF4F8" }]}>
          <Text style={[s.badgeText, { color: "#1B6B8A" }]}>
            Question {index}
          </Text>
        </View>
        <View style={[s.badge, { backgroundColor: "#F3F4F6" }]}>
          <Text style={[s.badgeText, { color: "#6B7280" }]}>
            {TYPE_LABEL[qs.question.questionType] ?? qs.question.questionType}
          </Text>
        </View>
      </View>

      {/* Question text */}
      <Text style={s.questionText}>{qs.question.questionText}</Text>

      {/* Answers */}
      {isOpen ? (
        <Text style={s.totalText}>Réponse libre — non notée</Text>
      ) : qs.slices.length === 0 ? (
        <Text style={s.totalText}>Aucune réponse</Text>
      ) : (
        qs.slices.map((slice, i) => {
          const color = getSliceColor(
            slice.isCorrect,
            isSurvey ? i : slice.isCorrect === false ? wrongIdx++ : 0,
            isSurvey,
          );
          const pct = total > 0 ? Math.round((slice.count / total) * 100) : 0;
          const barW = `${pct}%`;

          return (
            <View key={slice.label} style={s.barRow}>
              <View style={[s.dot, { backgroundColor: color }]} />
              <Text style={s.barLabel} numberOfLines={1}>
                {slice.label}
              </Text>
              <View style={s.barTrack}>
                <View
                  style={[s.barFill, { width: barW, backgroundColor: color }]}
                />
              </View>
              <Text style={[s.barPct, { color }]}>{pct}%</Text>
              <Text style={s.barCount}>({slice.count})</Text>
            </View>
          );
        })
      )}

      <Text style={s.totalText}>
        {total} réponse{total > 1 ? "s" : ""} au total
      </Text>
    </View>
  );
}

interface Props {
  session: SessionDetail;
  questionStats: QuestionStats[];
  avgScore: number;
}

export function SessionPdfDocument({
  session,
  questionStats,
  avgScore,
}: Props) {
  const date = new Date(session.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalGraded = session.diagnosticResponses.filter(
    (r) => r.isCorrect !== null,
  ).length;
  const excellence = session.diagnosticResponses.filter(
    (r) => r.isCorrect === true,
  ).length;
  const excellencePct =
    totalGraded > 0 ? Math.round((excellence / totalGraded) * 100) : 0;

  const kpis = [
    {
      label: "Participants",
      value: String(session._count.guestStudents),
      bg: "#EBF4F8",
      color: "#1B6B8A",
    },
    {
      label: "Réponses collectées",
      value: String(session._count.diagnosticResponses),
      bg: "#EBF6F3",
      color: "#2A8970",
    },
    {
      label: "Score moyen",
      value: `${avgScore}%`,
      bg: "#EDF7EE",
      color: "#4CAF5A",
    },
    {
      label: "Excellence",
      value: `${excellencePct}%`,
      bg: "#EEEEFD",
      color: "#6366F1",
    },
  ];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <View style={s.brandRow}>
              <Text style={s.brandBlue}>PASSEPORT</Text>
              <Text style={s.brandGreen}> SANTÉ</Text>
            </View>
            <Text style={s.title}>{session.className}</Text>
            <Text style={s.subtitle}>
              Session du {date} · Code : {session.accessCode}
            </Text>
          </View>
          <View style={s.headerRight}>
            <View
              style={[
                s.pill,
                { backgroundColor: session.isActive ? "#2A8970" : "#6B7280" },
              ]}
            >
              <Text style={s.pillText}>
                {session.isActive ? "Active" : "Terminée"}
              </Text>
            </View>
          </View>
        </View>

        {/* KPIs */}
        <View style={s.kpiRow}>
          {kpis.map((k) => (
            <View key={k.label} style={[s.kpiCard, { backgroundColor: k.bg }]}>
              <Text style={[s.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={s.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Questions */}
        <Text style={s.sectionTitle}>
          Résultats par question ({questionStats.length})
        </Text>

        <View style={s.grid}>
          {questionStats.map((qs, i) => (
            <QuestionCard key={qs.question.id} qs={qs} index={i + 1} />
          ))}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Passeport Santé — Export résultats</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
