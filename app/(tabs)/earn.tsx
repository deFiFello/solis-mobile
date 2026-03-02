// ═══════════════════════════════════════════════════════════
// EARN SCREEN — Yield Opportunities (Coming Soon)
// ═══════════════════════════════════════════════════════════

import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWallet } from "../../contexts/WalletProvider";

const C = {
  bg: "#000000", surface: "#1A1A1A", border: "#2D2D2D",
  green: "#BDFF00", white: "#FFFFFF",
  muted: "rgba(255,255,255,0.4)", dimmed: "rgba(255,255,255,0.25)",
  subtle: "rgba(255,255,255,0.15)",
};

type Protocol = {
  name: string;
  type: string;
  assets: string;
  note: string;
};

const PROTOCOLS: Protocol[] = [
  { name: "Kamino Finance", type: "Automated Vaults", assets: "SOL, USDC, USDT", note: "Concentrated liquidity vaults with auto-rebalancing" },
  { name: "Meteora", type: "LP Pools", assets: "SOL, USDC, BTC wrappers", note: "Dynamic fee pools optimized for volatile pairs" },
  { name: "Marinade Finance", type: "Liquid Staking", assets: "SOL → mSOL", note: "Stake SOL and stay liquid with mSOL" },
  { name: "Jito", type: "Liquid Staking", assets: "SOL → JitoSOL", note: "MEV-boosted SOL staking yields" },
  { name: "Drift Protocol", type: "Lending", assets: "USDC, SOL", note: "Supply assets to earn variable borrow interest" },
];

export default function EarnScreen() {
  const insets = useSafeAreaInsets();
  const { isConnected } = useWallet();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>Earn</Text>
      <Text style={s.sub}>
        Put your assets to work. Yield opportunities from verified Solana protocols — integrated directly into Solis.
      </Text>

      <View style={s.statusCard}>
        <View style={s.statusDot} />
        <Text style={s.statusText}>COMING SOON</Text>
      </View>

      {/* What's coming */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>WHAT TO EXPECT</Text>
        <Text style={s.body}>
          Earn yield on your holdings without leaving Solis. We're integrating with top Solana DeFi protocols to offer staking, liquidity provision, and lending — all accessible from one screen.
        </Text>
        <Text style={[s.body, { marginTop: 10 }]}>
          Every opportunity will show verified APYs, risk ratings, and transparent fee structures. No mock data, no inflated numbers.
        </Text>
      </View>

      {/* Protocols */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>PLANNED INTEGRATIONS</Text>
        {PROTOCOLS.map((p, i) => (
          <View key={i} style={[s.protocolCard, i > 0 && { marginTop: 8 }]}>
            <View style={s.protocolHeader}>
              <Text style={s.protocolName}>{p.name}</Text>
              <Text style={s.protocolType}>{p.type}</Text>
            </View>
            <Text style={s.protocolAssets}>{p.assets}</Text>
            <Text style={s.protocolNote}>{p.note}</Text>
          </View>
        ))}
      </View>

      {/* Revenue model */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>HOW IT WORKS</Text>
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Your yield</Text>
            <Text style={s.infoValue}>Protocol native APY</Text>
          </View>
          <View style={s.infoDivider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Solis fee</Text>
            <Text style={s.infoValue}>Referral only — no extra cost</Text>
          </View>
          <View style={s.infoDivider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Custody</Text>
            <Text style={s.infoValue}>Self-custody — always yours</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: "InterBold", fontSize: 22, color: C.white, letterSpacing: 0.5 },
  sub: { fontFamily: "Inter", fontSize: 13, color: C.muted, marginTop: 8, lineHeight: 20 },

  statusCard: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(189,255,0,0.04)", borderWidth: 1, borderColor: "rgba(189,255,0,0.15)",
    paddingVertical: 10, paddingHorizontal: 14, marginTop: 16, alignSelf: "flex-start",
  },
  statusDot: { width: 6, height: 6, backgroundColor: C.green, borderRadius: 3 },
  statusText: { fontFamily: "InterSemiBold", fontSize: 10, color: C.green, letterSpacing: 2 },

  section: { marginTop: 28 },
  sectionTitle: { fontFamily: "InterSemiBold", fontSize: 10, color: C.dimmed, letterSpacing: 2, marginBottom: 12 },
  body: { fontFamily: "Inter", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 21 },

  protocolCard: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 14,
  },
  protocolHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  protocolName: { fontFamily: "InterSemiBold", fontSize: 14, color: C.white },
  protocolType: { fontFamily: "Inter", fontSize: 10, color: C.dimmed, letterSpacing: 0.5 },
  protocolAssets: { fontFamily: "Inter", fontSize: 11, color: C.green, marginTop: 6 },
  protocolNote: { fontFamily: "Inter", fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 17 },

  infoCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 16 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9 },
  infoDivider: { height: 1, backgroundColor: C.border },
  infoLabel: { fontFamily: "Inter", fontSize: 13, color: C.muted },
  infoValue: { fontFamily: "InterSemiBold", fontSize: 12, color: "rgba(255,255,255,0.7)" },
});
