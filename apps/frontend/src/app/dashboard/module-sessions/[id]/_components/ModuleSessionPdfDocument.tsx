import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ModuleSessionDetail, StepStats } from "@/lib/dashboard";

const GAME_TYPE_LABEL: Record<string, string> = {
  KANBAN:        "Trie les éléments",
  PHRASE_A_TROU: "Phrase à trou",
  PUZZLE:        "Puzzle",
  SCENARIO:      "Mise en situation",
  QUIZ:          "Quiz final",
  MOTS_CROISES:  "Mots croisés",
};

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", backgroundColor: "#F8FAFC", padding: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brandBlue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#175D95" },
  brandGreen: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#2A8970" },
  headerRight: { alignItems: "flex-end" },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  pillText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#1A1A1A", marginBottom: 4 },
  subtitle: { fontSize: 9, color: "#6B7280" },
  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  kpiCard: { flex: 1, borderRadius: 10, padding: 14 },
  kpiValue: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  kpiLabel: { fontSize: 7, color: "#6B7280", textTransform: "uppercase" },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1A1A1A", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 7, fontFamily: "Helvetica-Bold" },
  gameLabel: { fontSize: 7, color: "#9CA3AF" },
  stepTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1A1A1A", marginBottom: 8 },
  successPct: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  barTrack: { height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, marginBottom: 6 },
  barFill: { height: 6, borderRadius: 3 },
  barMeta: { flexDirection: "row", justifyContent: "space-between" },
  barMetaText: { fontSize: 7, color: "#9CA3AF" },
  statRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statText: { fontSize: 7, color: "#6B7280" },
  noData: { fontSize: 8, color: "#9CA3AF", fontStyle: "italic" },
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

function StepCard({ stats, color }: { stats: StepStats; color: string }) {
  const { step, totalAttempts, correctCount, incorrectCount, successRate } = stats;
  const gameLabel = GAME_TYPE_LABEL[step.gameType ?? ""] ?? (step.gameType ?? "");
  const stepTitle = (step.content as { title?: string } | null)?.title;
  const barWidth = `${successRate}%`;

  return (
    <View style={s.card} wrap={false}>
      <View style={s.cardHeader}>
        <View>
          <View style={[s.badge, { backgroundColor: `${color}18` }]}>
            <Text style={[s.badgeText, { color }]}>Étape {step.order}</Text>
          </View>
          <Text style={[s.gameLabel, { marginTop: 3 }]}>{gameLabel}</Text>
          {stepTitle && <Text style={[s.stepTitle, { marginTop: 4 }]}>{stepTitle}</Text>}
        </View>
        {totalAttempts > 0 && (
          <Text style={[s.successPct, { color }]}>{successRate}%</Text>
        )}
      </View>

      {totalAttempts > 0 ? (
        <>
          <View style={s.barTrack}>
            <View style={[s.barFill, { width: barWidth, backgroundColor: color }]} />
          </View>
          <View style={s.barMeta}>
            <Text style={s.barMetaText}>{totalAttempts} tentative{totalAttempts > 1 ? "s" : ""}</Text>
            <Text style={s.barMetaText}>{successRate}% de réussite</Text>
          </View>
          <View style={s.statRow}>
            <View style={s.statItem}>
              <View style={[s.statDot, { backgroundColor: "#2A8970" }]} />
              <Text style={s.statText}>{correctCount} correct{correctCount > 1 ? "s" : ""}</Text>
            </View>
            <View style={s.statItem}>
              <View style={[s.statDot, { backgroundColor: "#EF4444" }]} />
              <Text style={s.statText}>{incorrectCount} incorrect{incorrectCount > 1 ? "s" : ""}</Text>
            </View>
          </View>
        </>
      ) : (
        <Text style={s.noData}>Aucune réponse pour cette étape.</Text>
      )}
    </View>
  );
}

interface Props {
  session: ModuleSessionDetail;
  stepStats: StepStats[];
  avgSuccess: number;
  totalResponses: number;
}

export function ModuleSessionPdfDocument({ session, stepStats, avgSuccess, totalResponses }: Props) {
  const color = session.module?.colorPrimary ?? "#1B6B8A";
  const date = new Date(session.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const totalStudents = session._count.guestStudents;

  const kpis = [
    { label: "Participants", value: String(totalStudents), bg: `${color}18`, color },
    { label: "Réponses enregistrées", value: String(totalResponses), bg: "#EBF6F3", color: "#2A8970" },
    { label: "Taux de réussite moyen", value: `${avgSuccess}%`, bg: "#EDF7EE", color: "#4CAF5A" },
  ];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <View style={s.brandRow}>
              <Text style={s.brandBlue}>PASSEPORT</Text>
              <Text style={s.brandGreen}> SANTÉ</Text>
            </View>
            <Text style={s.title}>{session.className}</Text>
            <Text style={s.subtitle}>
              {session.module ? `Module : ${session.module.title} · ` : ""}{date} · Code : {session.accessCode}
            </Text>
          </View>
          <View style={s.headerRight}>
            <View style={[s.pill, { backgroundColor: session.isActive ? "#2A8970" : "#6B7280" }]}>
              <Text style={s.pillText}>{session.isActive ? "Active" : "Terminée"}</Text>
            </View>
          </View>
        </View>

        <View style={s.kpiRow}>
          {kpis.map((k) => (
            <View key={k.label} style={[s.kpiCard, { backgroundColor: k.bg }]}>
              <Text style={[s.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={s.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>
          Résultats par étape ({stepStats.length})
        </Text>

        <View style={s.grid}>
          {stepStats.map((st) => (
            <StepCard key={st.step.id} stats={st} color={color} />
          ))}
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Passeport Santé — Export résultats module</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
