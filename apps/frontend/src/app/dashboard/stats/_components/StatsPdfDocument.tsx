import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { QuestionStats } from "@/lib/dashboard";
import type { StatsResult } from "@/lib/stats";
import { QuestionCard } from "../../sessions/[id]/_components/SessionPdfDocument";
import { GAME_TYPE_LABEL } from "./labels";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", backgroundColor: "#F8FAFC", padding: 40, paddingBottom: 56 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brandBlue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#175D95" },
  brandGreen: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#2A8970" },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#1A1A1A", marginTop: 6, marginBottom: 4 },
  subtitle: { fontSize: 9, color: "#6B7280", marginBottom: 2 },
  filters: { fontSize: 9, color: "#1B6B8A", fontFamily: "Helvetica-Bold", marginBottom: 20 },
  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  kpiCard: { flex: 1, borderRadius: 10, padding: 12 },
  kpiValue: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  kpiLabel: { fontSize: 7, color: "#6B7280", textTransform: "uppercase" },
  kpiSub: { fontSize: 7, color: "#6B7280", marginTop: 2 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1A1A1A", marginBottom: 10, marginTop: 8 },
  table: { backgroundColor: "#FFFFFF", borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 20 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#F3F4F6", paddingVertical: 6, paddingHorizontal: 8 },
  th: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#9CA3AF", textTransform: "uppercase" },
  td: { fontSize: 8, color: "#374151" },
  tdBold: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#1A1A1A" },
  tdSub: { fontSize: 7, color: "#9CA3AF" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  moduleCard: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 10 },
  moduleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  moduleTitle: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  moduleMeta: { fontSize: 7, color: "#6B7280" },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  stepLabel: { fontSize: 7, color: "#374151", width: 170 },
  barTrack: { height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, flex: 1 },
  barFill: { height: 6, borderRadius: 3 },
  stepPct: { fontSize: 7, fontFamily: "Helvetica-Bold", width: 28, textAlign: "right" },
  stepCount: { fontSize: 7, color: "#9CA3AF", width: 52, textAlign: "right" },
  empty: { fontSize: 8, color: "#9CA3AF", marginBottom: 16 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#9CA3AF" },
});

const pct = (v: number | null) => (v === null ? "—" : `${v}%`);

// Colonnes du tableau comparatif : largeurs fixes pour aligner en-tête et lignes.
const COLS = [
  { key: "label", width: "30%" },
  { key: "diagSessions", width: "10%" },
  { key: "diagStudents", width: "14%" },
  { key: "diagAvgScore", width: "14%" },
  { key: "moduleSessions", width: "10%" },
  { key: "moduleStudents", width: "10%" },
  { key: "moduleSuccessRate", width: "12%" },
] as const;

interface Props {
  stats: StatsResult;
  questionStats: QuestionStats[];
  filtersLabel: string;
}

export function StatsPdfDocument({ stats, questionStats, filtersLabel }: Props) {
  const { diagnostic: d, modules: m } = stats;
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const kpis = [
    { label: "Élèves (diagnostic)", value: String(d.students), sub: `${d.completed} ont terminé · ${d.sessions} session(s)`, bg: "#EBF4F8", color: "#1B6B8A" },
    { label: "Score moyen diagnostic", value: pct(d.avgScore), sub: `${d.responses} réponses`, bg: "#EDF7EE", color: "#4CAF5A" },
    { label: "Élèves (modules)", value: String(m.students), sub: `${m.sessions} session(s)`, bg: "#EBF6F3", color: "#2A8970" },
    { label: "Réussite modules", value: pct(m.successRate), sub: `${m.responses} réponses`, bg: "#EEEEFD", color: "#6366F1" },
  ];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.brandRow}>
          <Text style={s.brandBlue}>PASSEPORT</Text>
          <Text style={s.brandGreen}> SANTÉ</Text>
        </View>
        <Text style={s.title}>Statistiques</Text>
        <Text style={s.subtitle}>Export du {date}</Text>
        <Text style={s.filters}>{filtersLabel}</Text>

        <View style={s.kpiRow}>
          {kpis.map((k) => (
            <View key={k.label} style={[s.kpiCard, { backgroundColor: k.bg }]}>
              <Text style={[s.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={s.kpiLabel}>{k.label}</Text>
              <Text style={s.kpiSub}>{k.sub}</Text>
            </View>
          ))}
        </View>

        {/* Tableau comparatif */}
        <Text style={s.sectionTitle}>
          {stats.breakdownBy === "organization" ? "Par établissement" : "Par classe"}
        </Text>
        {stats.breakdown.length === 0 ? (
          <Text style={s.empty}>Aucune session pour ces filtres.</Text>
        ) : (
          <View style={s.table}>
            <View style={s.tr} fixed>
              {[
                stats.breakdownBy === "organization" ? "Établissement" : "Classe",
                "Diag. sessions",
                "Diag. élèves",
                "Score diag.",
                "Mod. sessions",
                "Mod. élèves",
                "Réussite mod.",
              ].map((h, i) => (
                <Text key={h} style={[s.th, { width: COLS[i]!.width }]}>{h}</Text>
              ))}
            </View>
            {stats.breakdown.map((row) => (
              <View key={`${row.label}|${row.sublabel}`} style={s.tr} wrap={false}>
                <View style={{ width: COLS[0].width }}>
                  <Text style={s.tdBold}>{row.label}</Text>
                  {row.sublabel && <Text style={s.tdSub}>{row.sublabel}</Text>}
                </View>
                <Text style={[s.td, { width: COLS[1].width }]}>{row.diagSessions}</Text>
                <Text style={[s.td, { width: COLS[2].width }]}>{row.diagStudents} ({row.diagCompleted} terminés)</Text>
                <Text style={[s.tdBold, { width: COLS[3].width }]}>{pct(row.diagAvgScore)}</Text>
                <Text style={[s.td, { width: COLS[4].width }]}>{row.moduleSessions}</Text>
                <Text style={[s.td, { width: COLS[5].width }]}>{row.moduleStudents}</Text>
                <Text style={[s.tdBold, { width: COLS[6].width }]}>{pct(row.moduleSuccessRate)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Modules */}
        <Text style={s.sectionTitle} break={stats.breakdown.length > 12}>
          Modules
        </Text>
        {m.modules.length === 0 ? (
          <Text style={s.empty}>Aucune session de module pour ces filtres.</Text>
        ) : (
          m.modules.map((mod) => {
            const color = mod.module.colorPrimary ?? "#1B6B8A";
            return (
              <View key={mod.module.id} style={s.moduleCard} wrap={false}>
                <View style={s.moduleHeader}>
                  <Text style={[s.moduleTitle, { color }]}>{mod.module.title}</Text>
                  <Text style={s.moduleMeta}>
                    {mod.students} élève(s) · {mod.completed} ont terminé · {mod.sessions} session(s) · réussite {pct(mod.successRate)}
                  </Text>
                </View>
                {mod.steps.map((st) => (
                  <View key={st.step.id} style={s.stepRow}>
                    <Text style={s.stepLabel}>
                      Étape {st.step.order} · {st.step.content?.title ?? GAME_TYPE_LABEL[st.step.gameType ?? ""] ?? st.step.gameType}
                    </Text>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { width: `${st.successRate ?? 0}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={[s.stepPct, { color }]}>{pct(st.successRate)}</Text>
                    <Text style={s.stepCount}>{st.attempts} tentative(s)</Text>
                  </View>
                ))}
              </View>
            );
          })
        )}

        {/* Diagnostic : résultats par question */}
        <Text style={s.sectionTitle} break>
          Diagnostic — résultats par question ({questionStats.length})
        </Text>
        {questionStats.length === 0 ? (
          <Text style={s.empty}>Aucune réponse au diagnostic pour ces filtres.</Text>
        ) : (
          <View style={s.grid}>
            {questionStats.map((qs, i) => (
              <QuestionCard key={qs.question.id} qs={qs} index={i + 1} />
            ))}
          </View>
        )}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Passeport Santé — Statistiques · {filtersLabel}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
