import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
  Circle,
} from "@react-pdf/renderer";

const TEAL = "#1B6B8A";
const TEAL_DARK = "#124E66";
const GREEN = "#2A8970";
const MINT = "#5DD4BC";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", backgroundColor: "#FFFFFF" },

  frame: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    bottom: 16,
    borderWidth: 1.5,
    borderColor: "#CFE3EA",
    borderRadius: 14,
  },

  band: {
    backgroundColor: TEAL,
    paddingHorizontal: 50,
    paddingTop: 44,
    paddingBottom: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "hidden",
  },
  bandDeco: { position: "absolute", top: 0, left: 0 },
  brandRow: { flexDirection: "row" },
  brandA: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  brandB: { fontSize: 16, fontFamily: "Helvetica-Bold", color: MINT },
  bandTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  bandTagText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },

  body: {
    paddingHorizontal: 56,
    alignItems: "center",
    marginTop: -34,
  },

  badge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: GREEN,
    borderWidth: 5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  categoryLabel: {
    fontSize: 9,
    color: GREEN,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: TEAL_DARK,
    textAlign: "center",
  },
  divider: {
    width: 56,
    height: 3,
    backgroundColor: MINT,
    marginTop: 18,
    marginBottom: 22,
  },
  descText: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 1.7,
  },
  classPill: {
    backgroundColor: "#EBF4F8",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 7,
    marginVertical: 8,
  },
  classText: { fontFamily: "Helvetica-Bold", color: TEAL, fontSize: 16 },

  nameBox: { width: "70%", marginTop: 44, alignItems: "center" },
  nameLine: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#9CA3AF",
    borderBottomStyle: "dashed",
    height: 22,
  },
  nameLabel: { fontSize: 8, color: "#9CA3AF", marginTop: 5 },

  infoRow: { flexDirection: "row", marginTop: 44, width: "100%" },
  infoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    marginHorizontal: 5,
  },
  infoCardLabel: {
    fontSize: 7,
    color: "#9CA3AF",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1A1A1A",
    textAlign: "center",
  },

  footer: {
    position: "absolute",
    bottom: 34,
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
    <Document title={`Diagnostic Santé — ${className}`} author="Passeport Santé">
      <Page size="A4" style={s.page}>
        <View style={s.frame} fixed />

        {/* Header */}
        <View style={s.band}>
          <Svg width={595} height={150} style={s.bandDeco}>
            <Circle cx={520} cy={30} r={90} fill="#FFFFFF" fillOpacity={0.07} />
            <Circle cx={60} cy={150} r={70} fill="#FFFFFF" fillOpacity={0.06} />
          </Svg>
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
          <View style={s.badge}>
            <Svg width={38} height={38} viewBox="0 0 24 24">
              <Path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="#FFFFFF"
                strokeWidth={3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </View>

          <Text style={s.categoryLabel}>Bravo !</Text>
          <Text style={s.mainTitle}>Attestation de participation</Text>
          <View style={s.divider} />

          <Text style={s.descText}>Un élève de la classe</Text>
          <View style={s.classPill}>
            <Text style={s.classText}>{className}</Text>
          </View>
          <Text style={s.descText}>a complété l&apos;intégralité du Diagnostic Santé.</Text>

          <View style={s.nameBox}>
            <View style={s.nameLine} />
            <Text style={s.nameLabel}>Prénom de l&apos;élève (à compléter)</Text>
          </View>

          <View style={s.infoRow}>
            <View style={[s.infoCard, { flex: 1.2 }]}>
              <Text style={s.infoCardLabel}>Questions</Text>
              <Text style={s.infoCardValue}>{questionCount} répondues</Text>
            </View>
            <View style={[s.infoCard, { flex: 1.4 }]}>
              <Text style={s.infoCardLabel}>Date</Text>
              <Text style={s.infoCardValue}>{date}</Text>
            </View>
            <View style={[s.infoCard, { flex: 1 }]}>
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
