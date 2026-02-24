import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getTokenPrices } from "../../services/jupiterPrice";
import { getMacroData, getFearGreedIndex, getBtcDominance, type MacroDataPoint } from "../../services/macroData";
import { SOLIS_ASSETS } from "../../services/config";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 40; // 20px padding each side

// ─── Portfolio Card ────────────────────────────────────────
function PortfolioCard() {
  return (
    <View style={[styles.card, styles.portfolioCard]}>
      {/* Top row */}
      <View style={styles.cardTopRow}>
        <View style={styles.row}>
          <View style={styles.solisCircle}>
            <Text style={styles.solisCircleText}>S</Text>
          </View>
          <Text style={styles.walletAddr}>Connect wallet</Text>
        </View>
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>Portfolio</Text>
        </View>
      </View>

      {/* Balance */}
      <View>
        <Text style={styles.balanceText}>$0.00</Text>
        <View style={styles.row}>
          <Text style={styles.changeTextGreen}>--</Text>
          <Text style={styles.changePeriod}>24h</Text>
        </View>
      </View>

      {/* Bottom stats */}
      <View style={styles.cardBottomRow}>
        <View style={styles.row20}>
          <View>
            <Text style={styles.statLabel}>Assets</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Top</Text>
            <Text style={styles.statValue}>--</Text>
          </View>
        </View>
        <Text style={styles.solisWatermark}>SOLIS</Text>
      </View>
    </View>
  );
}

// ─── Shadow Card ───────────────────────────────────────────
function ShadowCard() {
  return (
    <View style={[styles.card, styles.shadowCard]}>
      {/* Top row */}
      <View style={styles.cardTopRow}>
        <View style={styles.row}>
          <View style={styles.shadowCircle}>
            <Text style={styles.shadowCircleText}>◈</Text>
          </View>
          <Text style={styles.shadowLabel}>ZK-SHIELDED</Text>
        </View>
        <View style={styles.shadowBadge}>
          <Text style={styles.shadowBadgeText}>Shadow</Text>
        </View>
      </View>

      {/* Balance */}
      <View>
        <Text style={styles.shadowSubLabel}>Shadow Balance</Text>
        <Text style={styles.balanceText}>$0.00</Text>
        <View style={styles.row}>
          <Text style={styles.dimText}>0 SOL</Text>
          <Text style={styles.dimmerText}>·</Text>
          <Text style={styles.dimText}>0 USDC</Text>
        </View>
      </View>

      {/* Bottom */}
      <View style={styles.cardBottomRow}>
        <Text style={styles.shadowCta}>Shadow a swap →</Text>
        <Text style={styles.shadowWatermark}>SOLIS</Text>
      </View>
    </View>
  );
}

// ─── Info Carousel ─────────────────────────────────────────
const INFO_SLIDES = [
  { icon: "◉", title: "24/7 Capital Markets", body: "Trade tokenized assets around the clock. No brokers, no banks, no market hours.", accent: "#fff", bg: "rgba(255,255,255,0.04)", border: "#222" },
  { icon: "◈", title: "Shadow Your Swaps", body: "ZK-shielded transactions break the on-chain link between you and your trades.", accent: "#b48cf0", bg: "rgba(140,100,200,0.06)", border: "rgba(140,100,200,0.15)" },
  { icon: "✦", title: "Seeker Perks", body: "Genesis Token holders get reduced fees, early access to stocks, and Seed Vault security.", accent: "#4ade80", bg: "rgba(74,222,128,0.05)", border: "rgba(74,222,128,0.15)" },
  { icon: "◐", title: "Tokenized Stocks", body: "Trade AAPL, TSLA, NVDA and 200+ equities 24/7 on Solana. Coming soon.", accent: "#f59e0b", bg: "rgba(245,158,11,0.05)", border: "rgba(245,158,11,0.15)" },
];

function InfoCarousel() {
  return (
    <View style={{ marginTop: 18 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={270}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
      >
        {INFO_SLIDES.map((slide, idx) => (
          <View
            key={idx}
            style={{
              width: 260,
              backgroundColor: slide.bg,
              borderWidth: 1,
              borderColor: slide.border,
              borderRadius: 14,
              padding: 16,
              gap: 8,
            }}
          >
            <View style={styles.row}>
              <Text style={{ fontSize: 16, color: slide.accent }}>{slide.icon}</Text>
              <Text style={{ fontFamily: "SpaceMonoBold", fontSize: 11, color: slide.accent, marginLeft: 8 }}>
                {slide.title}
              </Text>
            </View>
            <Text style={{ fontFamily: "SpaceMono", fontSize: 10, color: "#777", lineHeight: 15 }}>
              {slide.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Scrolling Market Ticker ───────────────────────────────
function MarketTicker({ data }: { data: MacroDataPoint[] }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (data.length === 0) return;

    // Auto-scroll animation
    let offset = 0;
    const tick = () => {
      offset += 0.5;
      if (offset > SCREEN_WIDTH * 2) offset = 0;
      scrollRef.current?.scrollTo({ x: offset, animated: false });
      animRef.current = Animated.timing(scrollX, { toValue: offset, duration: 16, useNativeDriver: false });
      requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [data]);

  if (data.length === 0) {
    return (
      <View style={styles.tickerWrap}>
        <Text style={{ fontFamily: "SpaceMono", fontSize: 10, color: "#555", textAlign: "center" }}>
          Loading market data...
        </Text>
      </View>
    );
  }

  // Double the data for seamless loop
  const doubled = [...data, ...data];

  return (
    <View style={styles.tickerWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
      >
        <View style={{ flexDirection: "row", gap: 24 }}>
          {doubled.map((item, idx) => (
            <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.tickerLabel}>{item.label}</Text>
              <Text style={styles.tickerValue}>{item.value}</Text>
              <Text style={[styles.tickerChange, { color: item.up ? "#4ade80" : "#f87171" }]}>
                {item.change}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Metric Cards ──────────────────────────────────────────
function MetricCards({
  fearGreed,
  btcDominance,
}: {
  fearGreed: { value: number; label: string } | null;
  btcDominance: number | null;
}) {
  return (
    <View style={styles.metricsRow}>
      <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>Fear & Greed</Text>
        <Text style={styles.metricValue}>
          {fearGreed ? `${fearGreed.value}` : "--"}
        </Text>
        <Text style={styles.metricSub}>
          {fearGreed?.label || "--"}
        </Text>
      </View>
      <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>BTC Dom</Text>
        <Text style={styles.metricValue}>
          {btcDominance ? `${btcDominance.toFixed(1)}%` : "--"}
        </Text>
      </View>
    </View>
  );
}

// ─── Holdings Row ──────────────────────────────────────────
function HoldingRow({ symbol, name, price }: { symbol: string; name: string; price: number | null }) {
  return (
    <Pressable style={styles.holdingRow}>
      <View style={styles.holdingIcon}>
        <Text style={styles.holdingIconText}>{symbol.slice(0, 2)}</Text>
      </View>
      <View style={styles.holdingInfo}>
        <View style={styles.holdingTopRow}>
          <Text style={styles.holdingSymbol}>{symbol}</Text>
          <Text style={styles.holdingPrice}>
            {price !== null
              ? `$${price >= 1000 ? price.toLocaleString("en-US", { maximumFractionDigits: 0 }) : price < 0.01 ? price.toFixed(6) : price.toFixed(2)}`
              : "--"}
          </Text>
        </View>
        <View style={styles.holdingBottomRow}>
          <Text style={styles.holdingName}>{name}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Tab Selector ──────────────────────────────────────────
function AssetTabs({ active, onPress }: { active: string; onPress: (t: string) => void }) {
  const tabs = ["CRYPTO", "STABLES", "STOCKS"];
  return (
    <View style={styles.tabRow}>
      {tabs.map((t) => (
        <Pressable
          key={t}
          onPress={() => onPress(t)}
          style={[styles.tab, active === t && styles.tabActive]}
        >
          <Text style={[styles.tabText, active === t && styles.tabTextActive]}>
            {t}
            {t === "STOCKS" ? " ⏳" : ""}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [macroData, setMacroData] = useState<MacroDataPoint[]>([]);
  const [fearGreed, setFearGreed] = useState<{ value: number; label: string } | null>(null);
  const [btcDominance, setBtcDominance] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("CRYPTO");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const carouselRef = useRef<ScrollView>(null);
  const [activeCard, setActiveCard] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [priceData, macro, fg, btcD] = await Promise.all([
        getTokenPrices(),
        getMacroData(),
        getFearGreedIndex(),
        getBtcDominance(),
      ]);
      setPrices(priceData);
      if (macro.length > 0) setMacroData(macro);
      setFearGreed(fg);
      setBtcDominance(btcD);
    } catch (err) {
      console.error("[Home] Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const onCarouselScroll = (e: any) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    setActiveCard(page);
  };

  // Filter assets by tab
  const filteredAssets = SOLIS_ASSETS.filter((a) => {
    if (activeTab === "CRYPTO") return a.category === "crypto" || a.category === "base";
    if (activeTab === "STABLES") return a.category === "stablecoin";
    return false; // STOCKS coming soon
  });

  // Add SOL price from Jupiter to macroData
  const macroWithSol: MacroDataPoint[] = [
    ...macroData,
    ...(prices["SOL"]
      ? [{ label: "SOL", value: `$${prices["SOL"].toFixed(2)}`, change: "--", up: true }]
      : []),
    ...(prices["cbBTC"]
      ? [{ label: "BTC", value: `$${prices["cbBTC"].toLocaleString("en-US", { maximumFractionDigits: 0 })}`, change: "--", up: true }]
      : []),
  ];

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.row}>
          <Text style={styles.logoText}>Solis</Text>
          <View style={styles.betaBadge}>
            <Text style={styles.betaText}>BETA</Text>
          </View>
        </View>
        <Pressable style={styles.connectBtn}>
          <Text style={styles.connectText}>CONNECT</Text>
        </Pressable>
      </View>

      {/* Portfolio Carousel */}
      <ScrollView
        ref={carouselRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onCarouselScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
      >
        <View style={{ width: CARD_WIDTH, marginRight: 16 }}>
          <PortfolioCard />
        </View>
        <View style={{ width: CARD_WIDTH }}>
          <ShadowCard />
        </View>
      </ScrollView>

      {/* Dots */}
      <View style={styles.dotsRow}>
        <View style={[styles.dot, activeCard === 0 ? styles.dotActive : styles.dotInactive]} />
        <View style={[styles.dot, activeCard === 1 ? styles.dotShadowActive : styles.dotShadowInactive]} />
      </View>

      {/* Info Carousel */}
      <InfoCarousel />

      {/* Market Ticker */}
      <View style={{ marginTop: 16 }}>
        <MarketTicker data={macroWithSol} />
      </View>

      {/* Metrics */}
      <MetricCards fearGreed={fearGreed} btcDominance={btcDominance} />

      {/* Asset Tabs */}
      <AssetTabs active={activeTab} onPress={setActiveTab} />

      {/* Asset List */}
      {loading ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <ActivityIndicator color="#555" />
          <Text style={{ fontFamily: "SpaceMono", fontSize: 10, color: "#555", marginTop: 8 }}>
            Loading prices...
          </Text>
        </View>
      ) : activeTab === "STOCKS" ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <Text style={{ fontFamily: "SpaceMono", fontSize: 12, color: "#444" }}>Coming Soon</Text>
          <Text style={{ fontFamily: "SpaceMono", fontSize: 10, color: "#333", marginTop: 4 }}>
            Tokenized stocks via xStocks + Ondo
          </Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20 }}>
          {filteredAssets.map((asset, idx) => (
            <View
              key={asset.symbol}
              style={idx < filteredAssets.length - 1 ? styles.holdingBorder : undefined}
            >
              <HoldingRow
                symbol={asset.symbol}
                name={asset.name}
                price={prices[asset.symbol] || null}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoText: {
    fontFamily: "SpaceMonoBold",
    fontSize: 18,
    color: "#fff",
    letterSpacing: 1,
  },
  betaBadge: {
    backgroundColor: "#9333ea",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  betaText: {
    fontFamily: "SpaceMonoBold",
    fontSize: 8,
    color: "#fff",
    letterSpacing: 1,
  },
  connectBtn: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  connectText: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: "#aaa",
    letterSpacing: 0.5,
  },

  // Cards
  card: {
    width: "100%",
    height: 210,
    borderRadius: 20,
    padding: 22,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  portfolioCard: {
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#222",
  },
  shadowCard: {
    backgroundColor: "#0a0a0f",
    borderWidth: 1,
    borderColor: "rgba(140,100,200,0.15)",
  },

  // Card elements
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  solisCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  solisCircleText: {
    fontFamily: "SpaceMonoBold",
    fontSize: 13,
    color: "#000",
  },
  walletAddr: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: "#666",
    marginLeft: 10,
  },
  cardBadge: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  cardBadgeText: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    color: "#888",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  balanceText: {
    fontFamily: "SpaceMonoBold",
    fontSize: 36,
    color: "#fff",
    letterSpacing: -0.5,
  },
  changeTextGreen: {
    fontFamily: "SpaceMono",
    fontSize: 13,
    color: "#4ade80",
  },
  changePeriod: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: "#555",
    marginLeft: 8,
  },
  statLabel: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: "SpaceMono",
    fontSize: 12,
    color: "#aaa",
    marginTop: 2,
  },
  solisWatermark: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    color: "#444",
    letterSpacing: 0.5,
  },

  // Shadow card
  shadowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(140,100,200,0.2)",
    borderWidth: 1,
    borderColor: "rgba(140,100,200,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  shadowCircleText: {
    fontSize: 13,
    color: "rgba(180,140,240,0.8)",
  },
  shadowLabel: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: "rgba(140,100,200,0.5)",
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  shadowBadge: {
    backgroundColor: "rgba(140,100,200,0.08)",
    borderWidth: 1,
    borderColor: "rgba(140,100,200,0.2)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  shadowBadgeText: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    color: "rgba(180,140,240,0.6)",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  shadowSubLabel: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: "rgba(140,100,200,0.4)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  dimText: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: "#555",
  },
  dimmerText: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: "#444",
    marginHorizontal: 4,
  },
  shadowCta: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: "rgba(180,140,240,0.6)",
    letterSpacing: 0.3,
  },
  shadowWatermark: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    color: "rgba(140,100,200,0.25)",
    letterSpacing: 0.5,
  },

  // Dots
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: "#fff",
    transform: [{ scale: 1.2 }],
  },
  dotInactive: {
    backgroundColor: "#333",
  },
  dotShadowActive: {
    backgroundColor: "rgba(160,120,220,0.8)",
    transform: [{ scale: 1.2 }],
  },
  dotShadowInactive: {
    backgroundColor: "rgba(140,100,200,0.2)",
  },

  // Ticker
  tickerWrap: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#111",
    overflow: "hidden",
  },
  tickerLabel: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    color: "#555",
    letterSpacing: 0.5,
  },
  tickerValue: {
    fontFamily: "SpaceMonoBold",
    fontSize: 10,
    color: "#aaa",
  },
  tickerChange: {
    fontFamily: "SpaceMono",
    fontSize: 9,
  },

  // Metrics
  metricsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  metricLabel: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metricValue: {
    fontFamily: "SpaceMonoBold",
    fontSize: 18,
    color: "#fff",
  },
  metricSub: {
    fontFamily: "SpaceMono",
    fontSize: 9,
    color: "#666",
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 0,
    marginTop: 18,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabActive: {
    borderBottomWidth: 1,
    borderBottomColor: "#fff",
  },
  tabText: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: "#555",
    letterSpacing: 1,
  },
  tabTextActive: {
    color: "#fff",
  },

  // Holdings
  holdingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  holdingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  holdingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  holdingIconText: {
    fontFamily: "SpaceMonoBold",
    fontSize: 11,
    color: "#666",
  },
  holdingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  holdingTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  holdingBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 4,
  },
  holdingSymbol: {
    fontFamily: "SpaceMonoBold",
    fontSize: 14,
    color: "#fff",
  },
  holdingPrice: {
    fontFamily: "SpaceMonoBold",
    fontSize: 14,
    color: "#fff",
  },
  holdingName: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: "#555",
  },

  // Utility
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  row20: {
    flexDirection: "row",
    gap: 20,
  },
});
