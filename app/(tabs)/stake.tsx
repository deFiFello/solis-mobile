import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StakeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>Stake SKR</Text>
      <Text style={styles.sub}>Stake SKR to unlock reduced swap fees and Seeker+ perks.</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>SKR BALANCE</Text>
        <Text style={styles.cardValue}>Connect wallet</Text>
      </View>
      <View style={styles.tierCard}>
        <Text style={styles.tierTitle}>Fee Tiers</Text>
        <View style={styles.tierRow}><Text style={styles.tierLabel}>Standard</Text><Text style={styles.tierFee}>0.50%</Text></View>
        <View style={styles.tierRow}><Text style={styles.tierLabel}>Seeker (Genesis Token)</Text><Text style={styles.tierFee}>0.35%</Text></View>
        <View style={styles.tierRow}><Text style={styles.tierLabel}>Seeker+ (1,000 SKR)</Text><Text style={styles.tierFee}>0.25%</Text></View>
        <View style={styles.tierRow}><Text style={styles.tierLabel}>Seeker Pro (Staked)</Text><Text style={styles.tierFee}>0.15%</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 20 },
  title: { fontFamily: "SpaceMonoBold", fontSize: 20, color: "#fff", letterSpacing: 1 },
  sub: { fontFamily: "SpaceMono", fontSize: 11, color: "#666", marginTop: 8, lineHeight: 17 },
  card: {
    backgroundColor: "#0a0a0a", borderWidth: 1, borderColor: "#222", borderRadius: 16,
    padding: 20, marginTop: 24, gap: 8,
  },
  cardLabel: { fontFamily: "SpaceMono", fontSize: 9, color: "#555", letterSpacing: 1, textTransform: "uppercase" },
  cardValue: { fontFamily: "SpaceMonoBold", fontSize: 24, color: "#444" },
  tierCard: {
    backgroundColor: "#0a0a0a", borderWidth: 1, borderColor: "#1a1a1a", borderRadius: 16,
    padding: 20, marginTop: 16, gap: 12,
  },
  tierTitle: { fontFamily: "SpaceMonoBold", fontSize: 12, color: "#aaa", letterSpacing: 0.5 },
  tierRow: { flexDirection: "row", justifyContent: "space-between" },
  tierLabel: { fontFamily: "SpaceMono", fontSize: 10, color: "#666" },
  tierFee: { fontFamily: "SpaceMonoBold", fontSize: 10, color: "#4ade80" },
});
