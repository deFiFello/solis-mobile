import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LINKS = [
  { label: "Documentation", url: "https://solis-tokenized-markets.vercel.app/docs" },
  { label: "GitHub", url: "https://github.com/deFiFello/solis-icm-directory" },
  { label: "Fee Wallet (Solscan)", url: "https://solscan.io/account/EMp2t1K5Du4sQLA5v2YGKfCWjsLE2T5eNbhYjGGLRcLo" },
  { label: "Join Waitlist", url: "https://forms.gle/2LRiaZbVEc7zpmsC9" },
];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>More</Text>

      <View style={styles.section}>
        {LINKS.map((link, idx) => (
          <Pressable
            key={idx}
            style={[styles.linkRow, idx < LINKS.length - 1 && styles.borderBottom]}
            onPress={() => Linking.openURL(link.url)}
          >
            <Text style={styles.linkText}>{link.label}</Text>
            <Text style={styles.linkArrow}>→</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          Solis is a 24/7 capital markets platform for tokenized assets on Solana. 
          Trade Bitcoin wrappers, stablecoins, and tokenized stocks with ZK privacy via Shadow Mode.
        </Text>
      </View>

      <Text style={styles.version}>v1.1-mobile · Solis 2026</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 20 },
  title: { fontFamily: "SpaceMonoBold", fontSize: 20, color: "#fff", letterSpacing: 1 },
  section: {
    backgroundColor: "#0a0a0a", borderWidth: 1, borderColor: "#1a1a1a", borderRadius: 16,
    marginTop: 24, overflow: "hidden",
  },
  sectionTitle: {
    fontFamily: "SpaceMonoBold", fontSize: 11, color: "#aaa", letterSpacing: 0.5,
    padding: 16, paddingBottom: 4,
  },
  linkRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16,
  },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  linkText: { fontFamily: "SpaceMono", fontSize: 12, color: "#ccc" },
  linkArrow: { fontFamily: "SpaceMono", fontSize: 14, color: "#555" },
  aboutText: { fontFamily: "SpaceMono", fontSize: 10, color: "#666", lineHeight: 16, padding: 16, paddingTop: 8 },
  version: { fontFamily: "SpaceMono", fontSize: 9, color: "#333", textAlign: "center", marginTop: 32 },
});
