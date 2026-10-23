import { Document, Page, Text, View, StyleSheet, Svg, Path } from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", backgroundColor: "#FFFFFF" },

  band: {
    paddingHorizontal: 50,
    paddingVertical: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: { flexDirection: "row" },
  brandA: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  brandB: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.7)" },
  bandTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
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
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

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
  divider: { height: 3, marginTop: 20, marginBottom: 24, width: 44 },
  descText: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 1.8,
  },
  moduleTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
  },

  completionBox: {
    marginTop: 32,
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  completionPct: { fontSize: 32, fontFamily: "Helvetica-Bold" },
  completionLabel: { fontSize: 10, color: "#6B7280", marginTop: 2 },

  infoRow: { flexDirection: "row", marginTop: 32, width: "100%" },
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
  moduleTitle: string;
  categoryName: string | null;
  color: string;
  date: string;
}

export function ModuleCertificatePdf({ moduleTitle, categoryName, color, date }: Props) {
  const lightBg = `${color}18`;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header band in module color */}
        <View style={[s.band, { backgroundColor: color }]}>
          <View style={s.brandRow}>
            <Text style={s.brandA}>PASSEPORT </Text>
            <Text style={s.brandB}>SANTÉ</Text>
          </View>
          <View style={s.bandTag}>
            <Text style={s.bandTagText}>Module {categoryName ?? "Santé"}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={s.body}>
          {/* Badge */}
          <View style={[s.badge, { backgroundColor: lightBg, borderColor: color }]}>
            <Svg width={28} height={28} viewBox="0 0 24 24">
              <Path
                d="M12 2.5l2.95 6.46 7.05.78-5.26 4.88 1.45 6.94L12 17.9l-6.19 3.66 1.45-6.94L2 9.74l7.05-.78L12 2.5z"
                fill={color}
              />
            </Svg>
          </View>

          <Text style={s.categoryLabel}>Certificat de réussite</Text>
          <Text style={s.mainTitle}>Attestation de réussite</Text>
          <View style={[s.divider, { backgroundColor: color }]} />

          <Text style={s.descText}>
            Tu as brillamment terminé le module{"\n"}
            <Text style={[s.moduleTitle, { color }]}>{moduleTitle}</Text>
            {"\n"}Félicitations pour ton engagement !
          </Text>

          {/* Completion box */}
          <View style={[s.completionBox, { backgroundColor: lightBg }]}>
            <Text style={[s.completionPct, { color }]}>100%</Text>
            <Text style={s.completionLabel}>Module complété</Text>
          </View>

          {/* Info cards */}
          <View style={s.infoRow}>
            <View style={s.infoCard}>
              <Text style={s.infoCardLabel}>Module</Text>
              <Text style={s.infoCardValue}>{moduleTitle}</Text>
            </View>
            <View style={s.infoCard}>
              <Text style={s.infoCardLabel}>Date</Text>
              <Text style={s.infoCardValue}>{date}</Text>
            </View>
            <View style={s.infoCard}>
              <Text style={s.infoCardLabel}>Statut</Text>
              <Text style={[s.infoCardValue, { color }]}>Terminé</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Passeport Santé — {moduleTitle}</Text>
          <Text style={s.footerText}>{date}</Text>
        </View>
      </Page>
    </Document>
  );
}
