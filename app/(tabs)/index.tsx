import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Easing,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { getTokenPrices } from "../../services/jupiterPrice";
import { getMacroData, getFearGreedIndex, getBtcDominance, type MacroDataPoint } from "../../services/macroData";
import { getAllTokenMetadata, type TokenMetadata } from "../../services/heliusMetadata";
import { SOLIS_ASSETS } from "../../services/config";
import { useWallet } from "../../contexts/WalletProvider";
import { useSeeker } from "../../contexts/SeekerProvider";
import SolisLogo from "../../components/SolisLogo";
import TokenLogo from "../../components/TokenLogo";
import AnimatedPrice from "../../components/AnimatedPrice";
import Skeleton from "../../components/Skeleton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 40;

// ─── Brand V2 Colors ───────────────────────────────────────
const C = {
  bg: "#000000",
  surface: "#1A1A1A",
  border: "#2D2D2D",
  accent: "#BDFF00",
  white: "#FFFFFF",
  muted: "rgba(255,255,255,0.4)",
  mutedLight: "rgba(255,255,255,0.25)",
  mutedDim: "rgba(255,255,255,0.15)",
  purple: "rgba(140,100,200,0.8)",
  purpleBg: "rgba(140,100,200,0.06)",
  purpleBorder: "rgba(140,100,200,0.15)",
  red: "#f87171",
};

// ─── Format helpers ────────────────────────────────────────
function formatPrice(price: number | null | undefined): string {
  if (!price) return "";
  if (price >= 10000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

function formatUsdTotal(prices: Record<string, number>, balances: Record<string, number>): string {
  let total = 0;
  for (const [symbol, amount] of Object.entries(balances)) {
    if (amount > 0 && prices[symbol]) total += amount * prices[symbol];
  }
  if (total === 0) return "$0.00";
  if (total >= 1000) return `$${total.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `$${total.toFixed(2)}`;
}

// ─── Portfolio Card ────────────────────────────────────────
function PortfolioCard({ prices }: { prices: Record<string, number> }) {
  const { address, isConnected, balances } = useWallet();
  const { seekerMode, feeTier } = useSeeker();

  const heldAssets = Object.entries(balances).filter(([_, amt]) => amt > 0);
  const topHolding = heldAssets.length > 0
    ? heldAssets.sort((a, b) => b[1] - a[1])[0][0]
    : "--";
  const totalUsd = formatUsdTotal(prices, balances);

  return (
    <View style={[s.card, s.portfolioCard]}>
      <View style={s.cardTopRow}>
        <View style={s.row}>
          <SolisLogo variant="mark" size={26} color="green" />
          <Text style={s.walletAddr}>
            {isConnected && address
              ? `${address.slice(0, 4)}...${address.slice(-4)}`
              : "Connect wallet"}
          </Text>
        </View>
        <View style={s.row}>
          {seekerMode && (
            <View style={s.seekerBadge}>
              <Text style={s.seekerBadgeText}>⚡ SEEKER</Text>
            </View>
          )}
          <View style={s.cardBadge}>
            <Text style={s.cardBadgeText}>Portfolio</Text>
          </View>
        </View>
      </View>

      <View>
        <Text style={s.balanceText}>{isConnected ? totalUsd : "$0.00"}</Text>
        {seekerMode && (
          <View style={s.row}>
            <Text style={s.accentText}>{feeTier.feePercent} fee</Text>
            <Text style={s.mutedSmall}>{feeTier.label}</Text>
          </View>
        )}
      </View>

      <View style={s.cardBottomRow}>
        <View style={s.row20}>
          <View>
            <Text style={s.statLabel}>Assets</Text>
            <Text style={s.statValue}>{heldAssets.length}</Text>
          </View>
          <View>
            <Text style={s.statLabel}>Top</Text>
            <Text style={s.statValue}>{topHolding}</Text>
          </View>
        </View>
        <Text style={s.watermark}>SOLIS</Text>
      </View>
    </View>
  );
}

// ─── Shadow Card ───────────────────────────────────────────
function ShadowCard() {
  const { isConnected } = useWallet();
  return (
    <View style={[s.card, s.shadowCard]}>
      <View style={s.cardTopRow}>
        <View style={s.row}>
          <View style={s.shadowCircle}>
            <Text style={{ fontSize: 13, color: C.purple }}>◈</Text>
          </View>
          <Text style={s.shadowLabel}>ZK-SHIELDED</Text>
        </View>
        <View style={s.shadowBadge}>
          <Text style={s.shadowBadgeText}>Shadow</Text>
        </View>
      </View>

      <View>
        <Text style={s.shadowSubLabel}>Shadow Balance</Text>
        <Text style={s.balanceText}>{isConnected ? "Tap to view" : "$0.00"}</Text>
        <Text style={s.shadowNote}>
          {isConnected
            ? "Shadow balances require ZK proof — open swap to view"
            : "Connect wallet to view shielded balances"}
        </Text>
      </View>

      <View style={s.cardBottomRow}>
        <Text style={s.shadowCta}>Shadow a swap →</Text>
        <Text style={s.shadowWatermark}>SOLIS</Text>
      </View>
    </View>
  );
}

// ─── Info Carousel ─────────────────────────────────────────
const INFO_SLIDES = [
  { icon: "◉", title: "24/7 Capital Markets", body: "Trade tokenized assets around the clock. No brokers, no banks, no market hours.", accent: C.accent, bg: "rgba(189,255,0,0.03)", border: "rgba(189,255,0,0.1)" },
  { icon: "◈", title: "Shadow Your Swaps", body: "ZK-shielded transactions break the on-chain link between you and your trades.", accent: C.purple, bg: C.purpleBg, border: C.purpleBorder },
  { icon: "✦", title: "Seeker Perks", body: "Genesis Token holders get reduced fees, early access to stocks, and Seed Vault security.", accent: C.accent, bg: "rgba(189,255,0,0.03)", border: "rgba(189,255,0,0.1)" },
  { icon: "◐", title: "Tokenized Stocks", body: "Trade AAPL, TSLA, NVDA and 200+ equities 24/7 on Solana. Coming soon.", accent: C.muted, bg: "rgba(255,255,255,0.02)", border: C.border },
];

function InfoCarousel() {
  return (
    <View style={{ marginTop: 18 }}>
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        snapToInterval={270} decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
      >
        {INFO_SLIDES.map((slide, idx) => (
          <View key={idx} style={{ width: 260, backgroundColor: slide.bg, borderWidth: 1, borderColor: slide.border, padding: 16, gap: 8 }}>
            <View style={s.row}>
              <Text style={{ fontSize: 16, color: slide.accent }}>{slide.icon}</Text>
              <Text style={{ fontFamily: "InterBold", fontSize: 11, color: slide.accent, marginLeft: 8 }}>{slide.title}</Text>
            </View>
            <Text style={{ fontFamily: "Inter", fontSize: 10, color: C.muted, lineHeight: 15 }}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Scrolling Ticker (Native Animated — no flicker) ───────
function MarketTicker({ data }: { data: MacroDataPoint[] }) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (data.length === 0) return;
    const totalWidth = data.length * 160;
    const loop = Animated.loop(
      Animated.timing(animVal, {
        toValue: -totalWidth,
        duration: totalWidth * 30,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [data]);

  if (data.length === 0) {
    return (
      <View style={s.tickerWrap}>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
          <Skeleton width={100} height={12} />
          <Skeleton width={100} height={12} />
          <Skeleton width={100} height={12} />
        </View>
      </View>
    );
  }

  const tripled = [...data, ...data, ...data];
  return (
    <View style={s.tickerWrap}>
      <Animated.View style={{ flexDirection: "row", transform: [{ translateX: animVal }] }}>
        {tripled.map((item, idx) => (
          <View key={idx} style={{ flexDirection: "row", alignItems: "center", width: 160, paddingHorizontal: 8 }}>
            <Text style={s.tickerLabel}>{item.label}</Text>
            <Text style={[s.tickerValue, { marginLeft: 4 }]}>{item.value}</Text>
            <Text style={[s.tickerChange, { marginLeft: 4, color: item.up ? C.accent : C.red }]}>{item.change}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ─── Metric Cards ──────────────────────────────────────────
function MetricCards({ fearGreed, btcDominance }: { fearGreed: { value: number; label: string } | null; btcDominance: number | null }) {
  const fgColor = !fearGreed ? C.mutedLight
    : fearGreed.value <= 25 ? C.red
    : fearGreed.value <= 50 ? "#fb923c"
    : fearGreed.value <= 75 ? "#facc15"
    : C.accent;

  return (
    <View style={s.metricsRow}>
      <View style={s.metricCard}>
        <Text style={s.metricLabel}>Fear & Greed</Text>
        {fearGreed ? (
          <>
            <Text style={[s.metricValue, { color: fgColor }]}>{fearGreed.value}</Text>
            <Text style={s.metricSub}>{fearGreed.label}</Text>
          </>
        ) : (
          <Skeleton width={50} height={20} style={{ marginTop: 4 }} />
        )}
      </View>
      <View style={s.metricCard}>
        <Text style={s.metricLabel}>BTC Dom</Text>
        {btcDominance ? (
          <Text style={s.metricValue}>{btcDominance.toFixed(1)}%</Text>
        ) : (
          <Skeleton width={60} height={20} style={{ marginTop: 4 }} />
        )}
      </View>
    </View>
  );
}

// ─── Holding Row (with logo + animated price) ──────────────
function HoldingRow({ symbol, name, price, balance, loading, onPress }: {
  symbol: string; name: string; price: number | null; balance: number; loading: boolean; onPress?: () => void;
}) {
  const hasBalance = balance > 0;
  const priceStr = formatPrice(price);

  return (
    <Pressable style={s.holdingRow} android_ripple={{ color: "rgba(189,255,0,0.06)" }} onPress={onPress}>
      <TokenLogo symbol={symbol} size={38} />
      <View style={s.holdingInfo}>
        <View style={s.holdingTopRow}>
          <Text style={s.holdingSymbol}>{symbol}</Text>
          {loading && !price ? (
            <Skeleton width={70} height={16} />
          ) : (
            <AnimatedPrice value={priceStr || "--"} style={s.holdingPrice} />
          )}
        </View>
        <View style={s.holdingBottomRow}>
          <Text style={s.holdingName}>{name}</Text>
          {hasBalance && (
            <Text style={s.holdingBalance}>
              {balance < 0.001 ? balance.toFixed(6) : balance < 1 ? balance.toFixed(4) : balance.toFixed(2)}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ─── Tab Selector ──────────────────────────────────────────
function AssetTabs({ active, onPress }: { active: string; onPress: (t: string) => void }) {
  const tabs = ["CRYPTO", "STABLES", "STOCKS"];
  return (
    <View style={s.tabRow}>
      {tabs.map((t) => (
        <Pressable key={t} onPress={() => onPress(t)} style={[s.tab, active === t && s.tabActive]}>
          <Text style={[s.tabText, active === t && s.tabTextActive]}>
            {t}
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
  const { isConnected, isConnecting, address, connect, disconnect, balances, refreshBalances } = useWallet();
  const { seekerMode } = useSeeker();
  const router = useRouter();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [tokenMeta, setTokenMeta] = useState<Record<string, TokenMetadata>>({});
  const [macroData, setMacroData] = useState<MacroDataPoint[]>([]);
  const [fearGreed, setFearGreed] = useState<{ value: number; label: string } | null>(null);
  const [btcDominance, setBtcDominance] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("CRYPTO");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const refreshPulse = useRef(new Animated.Value(0)).current;

  const carouselRef = useRef<ScrollView>(null);
  const [activeCard, setActiveCard] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [priceData, macro, fg, btcD, meta] = await Promise.all([
        getTokenPrices(),
        getMacroData(),
        getFearGreedIndex(),
        getBtcDominance(),
        getAllTokenMetadata(),
      ]);
      if (Object.keys(priceData).length > 0) setPrices(priceData);
      if (Object.keys(meta).length > 0) setTokenMeta(meta);
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
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), refreshBalances()]);
    setRefreshing(false);
    // Success pulse
    refreshPulse.setValue(1);
    Animated.timing(refreshPulse, { toValue: 0, duration: 500, useNativeDriver: false }).start();
  };

  const onCarouselScroll = (e: any) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    setActiveCard(page);
  };

  const filteredAssets = SOLIS_ASSETS.filter((a) => {
    if (activeTab === "CRYPTO") return a.category === "crypto" || a.category === "btc";
    if (activeTab === "STABLES") return a.category === "stable";
    if (activeTab === "STOCKS") return a.category === "stock";
    return false;
  });

  const macroWithCrypto: MacroDataPoint[] = [
    ...macroData,
    ...(prices["SOL"] ? [{ label: "SOL", value: `$${prices["SOL"].toFixed(2)}`, change: "--", up: true }] : []),
    ...(prices["cbBTC"] ? [{ label: "BTC", value: `$${prices["cbBTC"].toLocaleString("en-US", { maximumFractionDigits: 0 })}`, change: "--", up: true }] : []),
  ];

  const portfolioBorderColor = refreshPulse.interpolate({
    inputRange: [0, 1],
    outputRange: ["#2D2D2D", "#BDFF00"],
  });

  return (
    <ScrollView
      style={[s.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
    >
      {/* Header */}
      <View style={s.header}>
        <SolisLogo variant="horizontal" size={24} color="green" />
        {isConnecting ? (
          <ActivityIndicator color={C.accent} size="small" />
        ) : isConnected ? (
          <Pressable style={s.connectedBtn} onPress={disconnect}>
            <View style={s.greenDot} />
            <Text style={s.connectedAddrText}>{address?.slice(0, 4)}...{address?.slice(-4)}</Text>
          </Pressable>
        ) : (
          <Pressable style={s.connectBtn} onPress={connect}>
            <Text style={s.connectText}>CONNECT</Text>
          </Pressable>
        )}
      </View>

      {/* Portfolio Carousel — pulse border on refresh */}
      <ScrollView
        ref={carouselRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onScroll={onCarouselScroll} scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        snapToInterval={CARD_WIDTH + 16} decelerationRate="fast"
      >
        <Animated.View style={{ width: CARD_WIDTH, marginRight: 16, borderWidth: 1, borderColor: portfolioBorderColor }}>
          <PortfolioCard prices={prices} />
        </Animated.View>
        <View style={{ width: CARD_WIDTH }}>
          <ShadowCard />
        </View>
      </ScrollView>

      {/* Dots */}
      <View style={s.dotsRow}>
        <View style={[s.dot, activeCard === 0 ? s.dotActive : s.dotInactive]} />
        <View style={[s.dot, activeCard === 1 ? s.dotShadowActive : s.dotShadowInactive]} />
      </View>

      <InfoCarousel />
      <View style={{ marginTop: 16 }}><MarketTicker data={macroWithCrypto} /></View>
      <MetricCards fearGreed={fearGreed} btcDominance={btcDominance} />
      <AssetTabs active={activeTab} onPress={setActiveTab} />

      {/* Asset List */}
      <View style={{ paddingHorizontal: 20 }}>
        {filteredAssets.map((asset, idx) => (
          <View key={asset.symbol} style={idx < filteredAssets.length - 1 ? s.holdingBorder : undefined}>
            <HoldingRow
              symbol={asset.symbol}
              name={asset.name}
              price={prices[asset.symbol] || null}
              balance={balances[asset.symbol] || 0}
              loading={loading}
              onPress={() => router.push(`/asset/${asset.symbol}`)}
            />
          </View>
        ))}
        {filteredAssets.length === 0 && (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ fontFamily: "Inter", fontSize: 12, color: C.mutedDim }}>No assets in this category</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  connectBtn: { borderWidth: 1, borderColor: C.accent, paddingHorizontal: 14, paddingVertical: 6 },
  connectText: { fontFamily: "InterSemiBold", fontSize: 10, color: C.accent, letterSpacing: 1 },
  connectedBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  connectedAddrText: { fontFamily: "SpaceMono", fontSize: 10, color: C.accent, letterSpacing: 0.3 },
  greenDot: { width: 6, height: 6, backgroundColor: C.accent },
  seekerBadge: { backgroundColor: "rgba(189,255,0,0.08)", borderWidth: 1, borderColor: "rgba(189,255,0,0.2)", paddingHorizontal: 8, paddingVertical: 3, marginRight: 6 },
  seekerBadgeText: { fontFamily: "InterBold", fontSize: 8, color: C.accent, letterSpacing: 0.5 },

  card: { width: "100%", height: 210, padding: 22, justifyContent: "space-between", overflow: "hidden" },
  portfolioCard: { backgroundColor: C.surface },
  shadowCard: { backgroundColor: "#0a0a0f", borderWidth: 1, borderColor: C.purpleBorder },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  walletAddr: { fontFamily: "SpaceMono", fontSize: 11, color: C.muted, marginLeft: 10 },
  cardBadge: { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 3 },
  cardBadgeText: { fontFamily: "Inter", fontSize: 9, color: C.muted, letterSpacing: 0.7, textTransform: "uppercase" },
  balanceText: { fontFamily: "InterBold", fontSize: 36, color: C.white, letterSpacing: -0.5 },
  accentText: { fontFamily: "SpaceMono", fontSize: 13, color: C.accent },
  mutedSmall: { fontFamily: "Inter", fontSize: 10, color: C.mutedLight, marginLeft: 8 },
  statLabel: { fontFamily: "Inter", fontSize: 9, color: C.mutedLight, textTransform: "uppercase", letterSpacing: 1 },
  statValue: { fontFamily: "SpaceMono", fontSize: 12, color: C.muted, marginTop: 2 },
  watermark: { fontFamily: "Inter", fontSize: 9, color: C.mutedDim, letterSpacing: 0.5 },
  shadowCircle: { width: 26, height: 26, backgroundColor: "rgba(140,100,200,0.2)", borderWidth: 1, borderColor: "rgba(140,100,200,0.3)", alignItems: "center", justifyContent: "center" },
  shadowBadge: { backgroundColor: "rgba(140,100,200,0.08)", borderWidth: 1, borderColor: "rgba(140,100,200,0.2)", paddingHorizontal: 10, paddingVertical: 3 },
  shadowBadgeText: { fontFamily: "Inter", fontSize: 9, color: "rgba(180,140,240,0.6)", letterSpacing: 0.7, textTransform: "uppercase" },
  shadowLabel: { fontFamily: "Inter", fontSize: 11, color: "rgba(140,100,200,0.5)", marginLeft: 10, letterSpacing: 0.5 },
  shadowSubLabel: { fontFamily: "Inter", fontSize: 10, color: "rgba(140,100,200,0.4)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 },
  shadowNote: { fontFamily: "Inter", fontSize: 10, color: "rgba(140,100,200,0.35)", marginTop: 4, lineHeight: 15 },
  shadowCta: { fontFamily: "InterMedium", fontSize: 11, color: "rgba(180,140,240,0.6)", letterSpacing: 0.3 },
  shadowWatermark: { fontFamily: "Inter", fontSize: 9, color: "rgba(140,100,200,0.25)", letterSpacing: 0.5 },

  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 14 },
  dot: { width: 7, height: 7 },
  dotActive: { backgroundColor: C.accent, transform: [{ scale: 1.2 }] },
  dotInactive: { backgroundColor: C.border },
  dotShadowActive: { backgroundColor: "rgba(160,120,220,0.8)", transform: [{ scale: 1.2 }] },
  dotShadowInactive: { backgroundColor: "rgba(140,100,200,0.2)" },

  tickerWrap: { paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.surface, overflow: "hidden" },
  tickerLabel: { fontFamily: "Inter", fontSize: 9, color: C.mutedLight, letterSpacing: 0.5 },
  tickerValue: { fontFamily: "SpaceMono", fontSize: 10, color: C.muted },
  tickerChange: { fontFamily: "SpaceMono", fontSize: 9 },

  metricsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginTop: 14 },
  metricCard: { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 14, gap: 4 },
  metricLabel: { fontFamily: "Inter", fontSize: 9, color: C.mutedLight, textTransform: "uppercase", letterSpacing: 0.8 },
  metricValue: { fontFamily: "InterBold", fontSize: 18, color: C.white },
  metricSub: { fontFamily: "Inter", fontSize: 9, color: C.muted },

  tabRow: { flexDirection: "row", paddingHorizontal: 20, marginTop: 18, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: C.surface },
  tab: { paddingVertical: 10, paddingHorizontal: 16 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: C.accent },
  tabText: { fontFamily: "InterSemiBold", fontSize: 10, color: C.mutedLight, letterSpacing: 1 },
  tabTextActive: { color: C.accent },

  holdingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  holdingBorder: { borderBottomWidth: 1, borderBottomColor: C.surface },
  holdingInfo: { marginLeft: 12, flex: 1 },
  holdingTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  holdingBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 },
  holdingSymbol: { fontFamily: "InterBold", fontSize: 14, color: C.white },
  holdingPrice: { fontFamily: "SpaceMono", fontSize: 14, color: C.white },
  holdingName: { fontFamily: "Inter", fontSize: 10, color: C.mutedLight },
  holdingBalance: { fontFamily: "SpaceMono", fontSize: 10, color: C.accent },

  row: { flexDirection: "row", alignItems: "center" },
  row20: { flexDirection: "row", gap: 20 },
});
