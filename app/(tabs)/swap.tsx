import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SwapScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>Swap</Text>
      <Text style={styles.sub}>Jupiter-powered swaps across 14+ tokenized assets.</Text>
      <View style={styles.card}>
        <Text style={styles.label}>FROM</Text>
        <View style={styles.inputRow}>
          <Text style={styles.amount}>0.0</Text>
          <Pressable style={styles.tokenBtn}>
            <Text style={styles.tokenText}>SOL ▾</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.arrowWrap}>
        <Text style={styles.arrow}>↕</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>TO</Text>
        <View style={styles.inputRow}>
          <Text style={styles.amount}>0.0</Text>
          <Pressable style={styles.tokenBtn}>
            <Text style={styles.tokenText}>USDC ▾</Text>
          </Pressable>
        </View>
      </View>
      <Pressable style={styles.swapBtn}>
        <Text style={styles.swapBtnText}>Connect Wallet</Text>
      </Pressable>
      <Text style={styles.note}>WebView integration coming — will connect to solis-tokenized-markets.vercel.app</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 20 },
  title: { fontFamily: "SpaceMonoBold", fontSize: 20, color: "#fff", letterSpacing: 1 },
  sub: { fontFamily: "SpaceMono", fontSize: 11, color: "#666", marginTop: 8, lineHeight: 17 },
  card: {
    backgroundColor: "#0a0a0a", borderWidth: 1, borderColor: "#222", borderRadius: 16,
    padding: 20, marginTop: 16, gap: 8,
  },
  label: { fontFamily: "SpaceMono", fontSize: 9, color: "#555", letterSpacing: 1 },
  inputRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amount: { fontFamily: "SpaceMonoBold", fontSize: 28, color: "#444" },
  tokenBtn: { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#333", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  tokenText: { fontFamily: "SpaceMonoBold", fontSize: 12, color: "#fff" },
  arrowWrap: { alignItems: "center", marginVertical: -8, zIndex: 1 },
  arrow: { fontSize: 20, color: "#555", backgroundColor: "#0a0a0a", paddingHorizontal: 8 },
  swapBtn: {
    backgroundColor: "#fff", borderRadius: 12, paddingVertical: 16,
    alignItems: "center", marginTop: 20,
  },
  swapBtnText: { fontFamily: "SpaceMonoBold", fontSize: 14, color: "#000" },
  note: { fontFamily: "SpaceMono", fontSize: 9, color: "#333", textAlign: "center", marginTop: 16 },
});
