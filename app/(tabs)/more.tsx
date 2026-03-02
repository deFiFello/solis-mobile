// ═══════════════════════════════════════════════════════════
// MORE SCREEN — Links, Info, Resources
// ═══════════════════════════════════════════════════════════

import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWallet } from "../../contexts/WalletProvider";
import { useSeeker } from "../../contexts/SeekerProvider";

const C = {
  bg: "#000000", surface: "#1A1A1A", border: "#2D2D2D",
  green: "#BDFF00", white: "#FFFFFF",
  muted: "rgba(255,255,255,0.4)", dimmed: "rgba(255,255,255,0.25)",
  subtle: "rgba(255,255,255,0.15)",
  purple: "#A855F7",
};

type LinkItem = { label: string; url: string; note?: string };

const PLATFORM_LINKS: LinkItem[] = [
  { label: "Solis Web Platform", url: "https://solis-tokenized-markets.vercel.app", note: "Full web experience" },
  { label: "Documentation", url: "https://solis-tokenized-markets.vercel.app/docs", note: "Platform overview, fees, roadmap" },
  { label: "Fee Wallet", url: "https://solscan.io/account/EMp2t1K5Du4sQLA5v2YGKfCWjsLE2T5eNbhYjGGLRcLo", note: "Transparent fee collection on Solscan" },
  { label: "Source Code", url: "https://github.com/deFiFello/solis-icm-directory", note: "Open source on GitHub" },
];

const ECOSYSTEM_LINKS: LinkItem[] = [
  { label: "Jupiter", url: "https://jup.ag", note: "Swap routing and liquidity" },
  { label: "PrivacyCash", url: "https://privacycash.org", note: "ZK privacy protocol" },
  { label: "Solana Mobile", url: "https://solanamobile.com", note: "Seeker and dApp Store" },
  { label: "Helius", url: "https://helius.dev", note: "RPC and token data" },
];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { isConnected, address } = useWallet();
  const { seekerMode, feeTier } = useSeeker();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>More</Text>

      {/* Wallet info */}
      {isConnected && address && (
        <View style={s.walletCard}>
          <View style={s.walletRow}>
            <Text style={s.walletLabel}>Connected</Text>
            <View style={s.connectedDot} />
          </View>
          <Text style={s.walletAddr}>{address.slice(0, 6)}...{address.slice(-4)}</Text>
          {seekerMode && (
            <View style={s.seekerRow}>
              <Text style={s.seekerBadge}>⚡ {feeTier.label}</Text>
              <Text style={s.seekerFee}>{feeTier.feePercent} swap fee</Text>
            </View>
          )}
          <Pressable
            style={s.solscanBtn}
            onPress={() => Linking.openURL(`https://solscan.io/account/${address}`)}
          >
            <Text style={s.solscanText}>View on Solscan ↗</Text>
          </Pressable>
        </View>
      )}

      {/* Platform links */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>SOLIS</Text>
        {PLATFORM_LINKS.map((link, i) => (
          <Pressable
            key={i}
            style={[s.linkRow, i < PLATFORM_LINKS.length - 1 && s.linkBorder]}
            onPress={() => Linking.openURL(link.url)}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.linkLabel}>{link.label}</Text>
              {link.note && <Text style={s.linkNote}>{link.note}</Text>}
            </View>
            <Text style={s.linkArrow}>↗</Text>
          </Pressable>
        ))}
      </View>

      {/* Ecosystem links */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>ECOSYSTEM</Text>
        {ECOSYSTEM_LINKS.map((link, i) => (
          <Pressable
            key={i}
            style={[s.linkRow, i < ECOSYSTEM_LINKS.length - 1 && s.linkBorder]}
            onPress={() => Linking.openURL(link.url)}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.linkLabel}>{link.label}</Text>
              {link.note && <Text style={s.linkNote}>{link.note}</Text>}
            </View>
            <Text style={s.linkArrow}>↗</Text>
          </Pressable>
        ))}
      </View>

      {/* About */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>ABOUT</Text>
        <View style={s.aboutCard}>
          <Text style={s.aboutText}>
            Solis is a 24/7 capital markets platform for tokenized assets on Solana. Trade Bitcoin wrappers, stablecoins, and tokenized stocks — self-custody, with no brokers, no banks, and no market hours.
          </Text>
          <View style={s.aboutDivider} />
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Assets</Text>
            <Text style={s.aboutValue}>22 tokens across 4 categories</Text>
          </View>
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Swap routing</Text>
            <Text style={s.aboutValue}>Jupiter V1 API</Text>
          </View>
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Platform fee</Text>
            <Text style={s.aboutValue}>0.50% (0.35% Seeker)</Text>
          </View>
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Privacy</Text>
            <Text style={s.aboutValue}>Shadow Swaps — coming to mobile</Text>
          </View>
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Custody</Text>
            <Text style={s.aboutValue}>Self-custody only</Text>
          </View>
        </View>
      </View>

      {/* Fee info */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>FEES</Text>
        <View style={s.aboutCard}>
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Standard swap</Text>
            <Text style={s.aboutValue}>0.50%</Text>
          </View>
          <View style={s.aboutDivider} />
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Seeker swap</Text>
            <Text style={s.aboutValue}>0.35%</Text>
          </View>
          <View style={s.aboutDivider} />
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Shadow swap (web)</Text>
            <Text style={s.aboutValue}>0.75%</Text>
          </View>
          <View style={s.aboutDivider} />
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Shadow withdraw</Text>
            <Text style={s.aboutValue}>0.35% + rent</Text>
          </View>
          <View style={s.aboutDivider} />
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Fee destination</Text>
            <Text style={s.aboutValueMono}>EMp2...cLo</Text>
          </View>
        </View>
      </View>

      <Text style={s.version}>Solis Mobile v2.0 · 2026</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: "InterBold", fontSize: 22, color: C.white, letterSpacing: 0.5 },

  walletCard: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    padding: 16, marginTop: 16, gap: 6,
  },
  walletRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  walletLabel: { fontFamily: "Inter", fontSize: 10, color: C.dimmed, letterSpacing: 1 },
  connectedDot: { width: 6, height: 6, backgroundColor: C.green, borderRadius: 3 },
  walletAddr: { fontFamily: "InterBold", fontSize: 16, color: C.white, fontVariant: ["tabular-nums"] },
  seekerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  seekerBadge: { fontFamily: "InterSemiBold", fontSize: 11, color: C.green },
  seekerFee: { fontFamily: "Inter", fontSize: 11, color: C.muted },
  solscanBtn: {
    borderWidth: 1, borderColor: C.border, paddingVertical: 8,
    alignItems: "center", marginTop: 6,
  },
  solscanText: { fontFamily: "InterSemiBold", fontSize: 11, color: C.green },

  section: { marginTop: 24 },
  sectionTitle: { fontFamily: "InterSemiBold", fontSize: 10, color: C.dimmed, letterSpacing: 2, marginBottom: 8 },

  linkRow: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: C.surface },
  linkBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  linkLabel: { fontFamily: "InterSemiBold", fontSize: 13, color: C.white },
  linkNote: { fontFamily: "Inter", fontSize: 10, color: C.muted, marginTop: 2 },
  linkArrow: { fontFamily: "Inter", fontSize: 14, color: C.dimmed, paddingLeft: 8 },

  aboutCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 16 },
  aboutText: { fontFamily: "Inter", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 21 },
  aboutDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  aboutRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 7 },
  aboutLabel: { fontFamily: "Inter", fontSize: 12, color: C.muted },
  aboutValue: { fontFamily: "InterSemiBold", fontSize: 12, color: "rgba(255,255,255,0.7)" },
  aboutValueMono: { fontFamily: "InterSemiBold", fontSize: 12, color: "rgba(255,255,255,0.7)", fontVariant: ["tabular-nums"] },

  version: { fontFamily: "Inter", fontSize: 9, color: C.subtle, textAlign: "center", marginTop: 32 },
});
