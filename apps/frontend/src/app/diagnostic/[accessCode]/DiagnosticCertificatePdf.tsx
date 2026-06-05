import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const TEAL = "#1B6B8A";
const GREEN = "#2A8970";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", backgroundColor: "#FFFFFF" },

  band: {
    backgroundColor: TEAL,
    paddingHorizontal: 50,
    paddingVertical: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: { flexDirection: "row" },
  brandA: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  brandB: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#5DD4BC" },
  bandTag: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  bandTagText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },

  body: {
    paddingHorizontal: 60,
    paddingTop: 56,
    paddingBottom: 40,
    alignItems: "center",
  },

  badge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EBF6F3",
    borderWidth: 3,
    borderColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  badgeTick: { fontSize: 30, fontFamily: "Helvetica-Bold", color: GREEN },

  categoryLabel: {
    fontSize: 9,
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#1A1A1A",
    textAlign: "center",
  },
  divider: {
    width: 44,
    height: 3,
    backgroundColor: TEAL,
    marginTop: 20,
    marginBottom: 24,
  },
  descText: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 1.8,
  },
  classText: {
    fontFamily: "Helvetica-Bold",
    color: TEAL,
    fontSize: 14,
  },

  infoRow: { flexDirection: "row", marginTop: 36 },
  infoCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    marginHorizontal: 6,
  },
  infoCardLabel: { fontSize: 8, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 },
  infoCardValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1A1A1A" },

  statsRow: {
    flexDirection: "row",
    marginTop: 32,
    backgroundColor: "#EBF4F8",
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statsValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: TEAL },
  statsLabel: { fontSize: 10, color: "#6B7280", marginTop: 2 },

  footer: {
    position: "absolute",
    bottom: 28,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
  },
  footerText: { fontSize: 8, color: "#9CA3AF" },
});

interface Props {
  className: string;
  date: string;
  questionCount: number;
}

export function DiagnosticCertificatePdf({ className, date, questionCount }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.band}>
          <View style={s.brandRow}>
            <Text style={s.brandA}>PASSEPORT </Text>
            <Text style={s.brandB}>SANTÉ</Text>
          </View>
          <View style={s.bandTag}>
            <Text style={s.bandTagText}>Diagnostic Santé</Text>
          </View>
        </View>

        {/* Body */}
        <View style={s.body}>
          {/* Badge checkmark */}
          <View style={s.badge}>
            <Text style={s.badgeTick}>✓</Text>
          </View>

          <Text style={s.categoryLabel}>Certificat de participation</Text>

          <Text style={s.mainTitle}>Attestation de participation</Text>

          <View style={s.divider} />

          <Text style={s.descText}>
            Un élève de la classe{"\n"}
            <Text style={s.classText}>{className}</Text>
            {"\n"}a complété l'intégralité du Diagnostic Santé.
          </Text>

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={{ alignItems: "center" }}>
              <Text style={s.statsValue}>{questionCount}</Text>
              <Text style={s.statsLabel}>questions répondues</Text>
            </View>
          </View>

          {/* Info cards */}
          <View style={s.infoRow}>
            <View style={s.infoCard}>
              <Text style={s.infoCardLabel}>Classe</Text>
              <Text style={s.infoCardValue}>{className}</Text>
            </View>
            <View style={s.infoCard}>
              <Text style={s.infoCardLabel}>Date</Text>
              <Text style={s.infoCardValue}>{date}</Text>
            </View>
            <View style={s.infoCard}>
              <Text style={s.infoCardLabel}>Statut</Text>
              <Text style={[s.infoCardValue, { color: GREEN }]}>Complété</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Passeport Santé — Diagnostic Santé</Text>
          <Text style={s.footerText}>{date}</Text>
        </View>
      </Page>
    </Document>
  );
}
