// ═══════════════════════════════════════════════════════════
// ASSET DETAIL PAGE V2 — Full UX Redesign
// Route: app/asset/[symbol].tsx
// ═══════════════════════════════════════════════════════════
// Upgrades: Count-up animations, live pulse, sparklines from
// real pool data, top-pool highlight, risk level indicator,
// mint address actions, improved About scanability, staggered
// entrance animations, 44px touch targets (Fitts's Law)

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Dimensions,
  Pressable,
  Animated,
  Clipboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import TokenLogo from "../../components/TokenLogo";
import { getAssetBySymbol, SOLIS_CONFIG } from "../../services/config";
import { getAssetMetadata } from "../../services/assetMetadata";
import { getStockFundamentals, isXStock, type StockFundamentals } from "../../services/finnhub";
// No SVG dependency — sparkline uses pure Views

// ─── Brand V2 Colors ──────────────────────────────────────
const C = {
  bg: "#000000",
  surface: "#1A1A1A",
  border: "#2D2D2D",
  green: "#BDFF00",
  red: "#FF4444",
  amber: "#F59E0B",
  white: "#FFFFFF",
  muted: "rgba(255,255,255,0.4)",
  dimmed: "rgba(255,255,255,0.25)",
  subtle: "rgba(255,255,255,0.15)",
  accent: "#BDFF00",
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────
interface DexPair {
  dexId: string;
  pairAddress: string;
  baseToken: { symbol: string };
  quoteToken: { symbol: string };
  priceUsd: string;
  priceChange: { h24: number };
  volume: { h24: number };
  liquidity: { usd: number };
  fdv: number;
  url: string;
}

interface MarketData {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  pairs: DexPair[];
  // Extended data from CoinGecko
  fdv: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  high24h: number;
  low24h: number;
  ath: number;
  athDate: string;
  atl: number;
  atlDate: string;
  volMcapRatio: number;
}

// ─── CoinGecko ID Map (verified IDs only) ────────────────
const COINGECKO_IDS: Record<string, string> = {
  cbBTC: "coinbase-wrapped-btc",
  WBTC: "wrapped-bitcoin",
  tBTC: "tbtc",
  LBTC: "lombard-staked-btc",
  SOL: "solana",
  USDC: "usd-coin",
  USDT: "tether",
  PYUSD: "paypal-usd",
  // Tokens without reliable CoinGecko IDs omitted —
  // zBTC, xBTC, USD1, CASH, hyUSD, SKR, xStocks
  // will use DexScreener + Jupiter fallback
};

// ─── Stablecoin price sanity check ───────────────────────
function sanitizePrice(price: number, category: string): number {
  if (category === "stable") {
    // If DexScreener returns an obviously wrong stablecoin price,
    // force to $1.00. Real depegs rarely go beyond ±5%.
    if (price > 1.10 || price < 0.90 || !price || isNaN(price)) return 1.0;
  }
  return price;
}

// ─── Helpers ──────────────────────────────────────────────
function fmt(n: number, decimals = 2): string {
  if (!n || isNaN(n)) return "--";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(decimals)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(decimals)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(decimals)}K`;
  return `$${n.toFixed(decimals)}`;
}

function fmtPrice(n: number): string {
  if (!n || isNaN(n)) return "--";
  if (n >= 1000) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

// ─── Soften risk language for neutral presentation ───────
function softenRisk(text: string): string {
  return text
    .replace(/\brisk\b/gi, "consideration")
    .replace(/\bCentralized custodian\b/i, "Single custodian model")
    .replace(/\bCentralized custody\b/i, "Managed custody model")
    .replace(/\bRegulatory risk/i, "Subject to regulatory oversight")
    .replace(/\bSmart contract risk/i, "Smart contract dependency")
    .replace(/\bCounterparty risk/i, "Counterparty dependency")
    .replace(/\bDe-?peg risk/i, "Peg stability factor")
    .replace(/\bLiquidity risk/i, "Liquidity availability")
    .replace(/\bCensorship risk/i, "Compliance controls")
    .replace(/\bBridge risk/i, "Bridge infrastructure dependency")
    .replace(/\bOracle risk/i, "Oracle data dependency");
}

// ─── Animated Count-Up Hook ───────────────────────────────
function useCountUp(target: number, duration = 1200): Animated.Value {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!target || isNaN(target)) return;
    animVal.setValue(0);
    Animated.timing(animVal, {
      toValue: target,
      duration,
      useNativeDriver: false,
    }).start();
  }, [target, duration]);

  return animVal;
}

// ─── Fade-In Wrapper ──────────────────────────────────────
function FadeSlideIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

// ─── Live Pulse Dot ───────────────────────────────────────
function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: C.green,
        opacity: pulse,
        marginLeft: 8,
        marginBottom: 4,
      }}
    />
  );
}

// ─── Mini Sparkline (from real pool liquidity data) ───────
function MiniSparkline({
  data,
  color = C.green,
  height = 20,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 1.5, height }}>
      {data.map((v, i) => {
        const barHeight = Math.max(2, ((v - min) / range) * (height - 3) + 3);
        return (
          <View
            key={i}
            style={{
              width: 2.5,
              height: barHeight,
              borderRadius: 1,
              backgroundColor: color,
              opacity: 0.3 + (i / (data.length - 1)) * 0.7,
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Risk Level Visual Indicator ──────────────────────────
function RiskLevel({ level }: { level: "Low" | "Medium" | "High" }) {
  // Neutral framing: not "risk level" but trust/complexity indicator
  const labelMap = { Low: "Standard", Medium: "Moderate", High: "Complex" };
  const colorMap = { Low: C.green, Medium: "rgba(255,255,255,0.5)", High: C.amber };
  const segmentMap = { Low: 1, Medium: 2, High: 3 };
  const color = colorMap[level] || "rgba(255,255,255,0.5)";
  const segments = segmentMap[level] || 2;
  const label = labelMap[level] || "Moderate";

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ flexDirection: "row", gap: 2 }}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              width: 14,
              height: 3,
              backgroundColor: i <= segments ? color : C.border,
            }}
          />
        ))}
      </View>
      <Text style={{ fontFamily: "InterSemiBold", fontSize: 11, color }}>{label}</Text>
    </View>
  );
}

// ─── Animated Number Display ──────────────────────────────
function AnimatedNumber({
  value,
  formatter,
  style,
  duration = 1200,
}: {
  value: number;
  formatter: (n: number) => string;
  style: any;
  duration?: number;
}) {
  const [display, setDisplay] = useState("--");
  const animRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!value || isNaN(value)) {
      setDisplay("--");
      return;
    }

    animRef.setValue(0);
    const listener = animRef.addListener(({ value: v }) => {
      setDisplay(formatter(v));
    });

    Animated.timing(animRef, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    return () => animRef.removeListener(listener);
  }, [value]);

  return <Text style={style}>{display}</Text>;
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function AssetDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const router = useRouter();

  const [tab, setTab] = useState<"markets" | "info">("markets");
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeAgo, setTimeAgo] = useState("");
  const [copied, setCopied] = useState(false);
  const [stockData, setStockData] = useState<StockFundamentals | null>(null);

  const asset = symbol ? getAssetBySymbol(symbol) : null;
  const meta = symbol ? getAssetMetadata(symbol) : null;

  // ─── Time-ago ticker ──────────────────────────────────────
  useEffect(() => {
    if (!lastUpdated) return;
    const tick = () => {
      const s = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (s < 5) setTimeAgo("just now");
      else if (s < 60) setTimeAgo(`${s}s ago`);
      else setTimeAgo(`${Math.floor(s / 60)}m ago`);
    };
    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // ─── Fetch Jupiter price as fallback ──────────────────────
  const fetchJupiterPrice = useCallback(async (mint: string): Promise<number> => {
    try {
      const res = await fetch(`https://api.jup.ag/price/v3/simple?ids=${mint}`, {
        headers: { "x-api-key": SOLIS_CONFIG.JUPITER_API_KEY, Accept: "application/json" },
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return data?.[mint]?.usdPrice || parseFloat(data?.[mint]?.price) || 0;
    } catch {
      return 0;
    }
  }, []);

  // ─── Fetch market data from DexScreener ──────────────────
  const fetchMarketData = useCallback(async () => {
    if (!asset) return;

    // Default extended fields
    let extended = {
      fdv: 0, circulatingSupply: 0, totalSupply: 0, maxSupply: 0,
      high24h: 0, low24h: 0, ath: 0, athDate: "", atl: 0, atlDate: "",
      volMcapRatio: 0,
    };

    // ─── CoinGecko extended data (parallel with DexScreener + Jupiter) ───
    const cgId = COINGECKO_IDS[asset.symbol];
    const cgPromise = cgId
      ? fetch(`https://api.coingecko.com/api/v3/coins/${cgId}?localization=false&tickers=false&community_data=false&developer_data=false`)
          .then((r) => {
            if (!r.ok) { console.warn(`[CoinGecko] ${r.status} for ${cgId}`); return null; }
            return r.json();
          })
          .catch((e) => { console.warn(`[CoinGecko] Failed: ${e.message}`); return null; })
      : Promise.resolve(null);

    // ─── DexScreener pools ───
    const dexPromise = fetch(`${SOLIS_CONFIG.DEXSCREENER_API}/tokens/${asset.mint}`)
      .then((r) => (r.ok ? r.json() : { pairs: [] }))
      .catch(() => ({ pairs: [] }));

    // ─── Jupiter price (reliable fallback) ───
    const jupPromise = fetchJupiterPrice(asset.mint);

    const [cgData, dexData, jupPrice] = await Promise.all([cgPromise, dexPromise, jupPromise]);

    // Parse CoinGecko extended data
    if (cgData?.market_data) {
      const md = cgData.market_data;
      extended = {
        fdv: md.fully_diluted_valuation?.usd || 0,
        circulatingSupply: md.circulating_supply || 0,
        totalSupply: md.total_supply || 0,
        maxSupply: md.max_supply || 0,
        high24h: md.high_24h?.usd || 0,
        low24h: md.low_24h?.usd || 0,
        ath: md.ath?.usd || 0,
        athDate: md.ath_date?.usd || "",
        atl: md.atl?.usd || 0,
        atlDate: md.atl_date?.usd || "",
        volMcapRatio: md.total_volume?.usd && md.market_cap?.usd
          ? (md.total_volume.usd / md.market_cap.usd) * 100
          : 0,
      };
    }

    // Parse DexScreener pools
    const pairs: DexPair[] = (dexData.pairs || [])
      .filter((p: any) => p.chainId === "solana")
      .sort((a: DexPair, b: DexPair) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

    // ─── Price resolution chain: CoinGecko → Jupiter → DexScreener → stablecoin default ───
    const cgPrice = cgData?.market_data?.current_price?.usd || 0;
    const dexPrice = pairs.length > 0 ? parseFloat(pairs[0].priceUsd) || 0 : 0;
    let resolvedPrice = cgPrice || jupPrice || dexPrice;
    resolvedPrice = sanitizePrice(resolvedPrice, asset.category);

    // ─── Change % resolution: CoinGecko → DexScreener → 0 ───
    const change24h = cgData?.market_data?.price_change_percentage_24h
      ?? (pairs.length > 0 ? pairs[0].priceChange?.h24 : 0)
      ?? 0;

    // ─── Volume: CoinGecko → DexScreener aggregate ───
    const volume24h = cgData?.market_data?.total_volume?.usd
      || pairs.reduce((sum: number, p: DexPair) => sum + (p.volume?.h24 || 0), 0);

    // ─── Market cap: CoinGecko → DexScreener FDV ───
    const marketCap = cgData?.market_data?.market_cap?.usd
      || (pairs.length > 0 ? pairs[0].fdv : 0)
      || 0;

    setMarketData({
      price: resolvedPrice,
      change24h,
      volume24h,
      marketCap,
      pairs: pairs.slice(0, 8),
      ...extended,
    });

    setLastUpdated(new Date());
  }, [asset, fetchJupiterPrice]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchMarketData();
      // Fetch stock fundamentals for xStocks
      if (asset && isXStock(asset.symbol)) {
        const fh = await getStockFundamentals(asset.symbol);
        setStockData(fh);
      }
      setLoading(false);
    })();
  }, [fetchMarketData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMarketData();
    if (asset && isXStock(asset.symbol)) {
      const fh = await getStockFundamentals(asset.symbol);
      setStockData(fh);
    }
    setRefreshing(false);
  }, [fetchMarketData]);

  // ─── Copy mint address ────────────────────────────────────
  const handleCopyMint = useCallback(() => {
    if (!asset) return;
    Clipboard.setString(asset.mint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [asset]);

  // ─── Derive sparkline data from pool liquidity values ─────
  const liquiditySparkline = useMemo(() => {
    if (!marketData?.pairs || marketData.pairs.length < 2) return [];
    return marketData.pairs.map((p) => p.liquidity?.usd || 0);
  }, [marketData?.pairs]);

  const volumeSparkline = useMemo(() => {
    if (!marketData?.pairs || marketData.pairs.length < 2) return [];
    return marketData.pairs.map((p) => p.volume?.h24 || 0);
  }, [marketData?.pairs]);

  // ─── Derive risk level from metadata ──────────────────────
  const riskLevel = useMemo((): "Low" | "Medium" | "High" => {
    if (!meta) return "Medium";
    const riskCount = meta.risks?.length || 0;
    if (riskCount <= 2) return "Low";
    if (riskCount <= 4) return "Medium";
    return "High";
  }, [meta]);

  // ─── Guard: unknown symbol ───────────────────────────────
  if (!asset) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Asset not found: {symbol}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categoryLabel =
    asset.category === "btc"
      ? "BTC WRAPPER"
      : asset.category === "stable"
      ? "STABLECOIN"
      : asset.category === "stock"
      ? "TOKENIZED STOCK"
      : "CRYPTO";

  const isPositive = (marketData?.change24h || 0) >= 0;

  return (
    <View style={styles.container}>
      {/* ─── Header ──────────────────────────────────────── */}
      <FadeSlideIn delay={0}>
        <View style={styles.header}>
          {/* Back — 44px hit area (Fitts's Law) */}
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.headerBack}
          >
            <Text style={{ color: C.white, fontSize: 24 }}>‹</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <TokenLogo symbol={asset.symbol} size={36} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.headerSymbol}>{asset.symbol}</Text>
              <Text style={styles.headerName} numberOfLines={1}>
                {asset.name}
              </Text>
            </View>
          </View>

          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{categoryLabel}</Text>
          </View>
        </View>
      </FadeSlideIn>

      {/* ─── Price Banner ─────────────────────────────────── */}
      <FadeSlideIn delay={80}>
        {loading ? (
          <View style={styles.priceBanner}>
            <ActivityIndicator color={C.green} size="small" />
          </View>
        ) : (
          <View style={styles.priceBanner}>
            <View style={styles.priceRow}>
              <AnimatedNumber
                value={marketData?.price || 0}
                formatter={fmtPrice}
                style={styles.priceValue}
                duration={1400}
              />
              <LiveDot />
            </View>

            <View style={styles.priceSecondRow}>
              <View
                style={[
                  styles.changePill,
                  {
                    backgroundColor: isPositive
                      ? "rgba(189,255,0,0.12)"
                      : "rgba(255,68,68,0.12)",
                  },
                ]}
              >
                <Text style={[styles.changeText, { color: isPositive ? C.green : C.red }]}>
                  {isPositive ? "▲" : "▼"} {Math.abs(marketData?.change24h || 0).toFixed(2)}%
                </Text>
              </View>

              {lastUpdated && (
                <Text style={styles.updatedText}>Updated {timeAgo}</Text>
              )}
            </View>
          </View>
        )}
      </FadeSlideIn>

      {/* ─── Tab Bar ──────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {(["markets", "info"] as const).map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ─── Tab Content ──────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />
        }
        showsVerticalScrollIndicator={false}
      >
        {tab === "markets" ? (
          <MarketsTab
            data={marketData}
            loading={loading}
            asset={asset}
            volumeSparkline={volumeSparkline}
            liquiditySparkline={liquiditySparkline}
            stockData={stockData}
          />
        ) : (
          <InfoTab
            meta={meta ?? undefined}
            asset={asset}
            riskLevel={riskLevel}
            copied={copied}
            onCopyMint={handleCopyMint}
          />
        )}
      </ScrollView>

      {/* ─── Swap CTA ─────────────────────────────────────── */}
      <View style={styles.ctaContainer}>
        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
          onPress={() => router.push("/(tabs)/swap")}
          android_ripple={{ color: "rgba(0,0,0,0.3)" }}
        >
          <Text style={styles.ctaText}>Swap {asset.symbol}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// MARKETS TAB
// ═══════════════════════════════════════════════════════════
function MarketsTab({
  data,
  loading,
  asset,
  volumeSparkline,
  liquiditySparkline,
  stockData,
}: {
  data: MarketData | null;
  loading: boolean;
  asset: { symbol: string; mint: string; category: string };
  volumeSparkline: number[];
  liquiditySparkline: number[];
  stockData: StockFundamentals | null;
}) {
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={C.green} />
      </View>
    );
  }

  const poolCount = data?.pairs?.length || 0;

  // Format supply numbers (no $ prefix)
  const fmtSupply = (n: number): string => {
    if (!n || isNaN(n)) return "--";
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
    return n.toFixed(2);
  };

  // Format date string
  const fmtDate = (s: string): string => {
    if (!s) return "--";
    try { return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
    catch { return "--"; }
  };

  // Day's range bar position (0-1)
  const dayRangePos = data?.high24h && data?.low24h && data?.price
    ? Math.max(0, Math.min(1, (data.price - data.low24h) / (data.high24h - data.low24h || 1)))
    : 0;

  // Contextual stat labels based on asset category
  const isStock = asset.category === "stock";
  const isBtcWrapper = asset.category === "btc";
  const volumeLabel = isStock ? "DEX Volume (24h)" : isBtcWrapper ? "On-Chain Volume" : "Volume (24h)";
  const mcapLabel = isStock ? "On-Chain Liquidity" : isBtcWrapper ? "Wrapped TVL" : "Market Cap";

  // Peg accuracy for xStocks (compare DexScreener price vs Finnhub real price)
  const pegAccuracy = isStock && stockData?.quote?.current && data?.price
    ? Math.abs(1 - (data.price / stockData.quote.current)) * 100
    : null;

  return (
    <View>
      {/* ─── xStock: Peg Status Banner ─── */}
      {isStock && stockData?.quote && data?.price && pegAccuracy !== null && (
        <FadeSlideIn delay={100}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: pegAccuracy < 1 ? "rgba(189,255,0,0.2)" : "rgba(245,158,11,0.2)",
            padding: 12,
            marginBottom: 12,
          }}>
            <View>
              <Text style={{ fontFamily: "Inter", fontSize: 11, color: C.muted, letterSpacing: 0.5 }}>
                PEG STATUS
              </Text>
              <Text style={{
                fontFamily: "InterSemiBold",
                fontSize: 13,
                color: pegAccuracy < 1 ? C.green : C.amber,
                marginTop: 2,
              }}>
                {pegAccuracy < 0.5 ? "Tracking accurately" : pegAccuracy < 1 ? "Minor deviation" : "Deviation detected"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontFamily: "Inter", fontSize: 10, color: C.muted }}>
                Real: ${stockData.quote.current.toFixed(2)}
              </Text>
              <Text style={{ fontFamily: "Inter", fontSize: 10, color: C.muted, marginTop: 1 }}>
                Token: {fmtPrice(data.price)} ({pegAccuracy.toFixed(2)}% diff)
              </Text>
            </View>
          </View>
        </FadeSlideIn>
      )}

      {/* Primary Stats — contextual labels */}
      <View style={styles.statsGrid}>
        <FadeSlideIn delay={120} style={styles.statCard}>
          <Text style={styles.statLabel}>{volumeLabel}</Text>
          <View style={styles.statBottom}>
            <AnimatedNumber
              value={data?.volume24h || 0}
              formatter={fmt}
              style={styles.statValue}
              duration={1000}
            />
            {volumeSparkline.length >= 2 && (
              <MiniSparkline data={volumeSparkline} color={C.green} />
            )}
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={180} style={styles.statCard}>
          <Text style={styles.statLabel}>{mcapLabel}</Text>
          <View style={styles.statBottom}>
            <AnimatedNumber
              value={isStock
                ? (data?.pairs || []).reduce((sum, p) => sum + (p.liquidity?.usd || 0), 0)
                : data?.marketCap || 0}
              formatter={fmt}
              style={styles.statValue}
              duration={1000}
            />
            {liquiditySparkline.length >= 2 && (
              <MiniSparkline data={liquiditySparkline} color="rgba(255,255,255,0.3)" />
            )}
          </View>
        </FadeSlideIn>
      </View>

      {/* ─── Extended Market Data Grid (only when CoinGecko data available) ─── */}
      {(data?.fdv || data?.circulatingSupply || data?.ath) ? (
        <FadeSlideIn delay={220}>
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>MARKET DATA</Text>

            {/* Day's Range with visual bar */}
            {(data?.high24h || 0) > 0 && (
              <View style={mdStyles.rangeContainer}>
                <View style={mdStyles.rangeLabels}>
                  <Text style={mdStyles.rangeLabel}>Day's Range</Text>
                </View>
                <View style={mdStyles.rangeBarOuter}>
                  <View style={[mdStyles.rangeBarFill, { width: `${dayRangePos * 100}%` }]} />
                  <View style={[mdStyles.rangeIndicator, { left: `${dayRangePos * 100}%` }]} />
                </View>
                <View style={mdStyles.rangeValues}>
                  <Text style={mdStyles.rangeValue}>{fmtPrice(data?.low24h || 0)}</Text>
                  <Text style={mdStyles.rangeValue}>{fmtPrice(data?.high24h || 0)}</Text>
                </View>
              </View>
            )}

            {/* Two-column stat grid */}
            <View style={mdStyles.grid}>
              <MarketStatRow label="FDV" value={fmt(data?.fdv || 0)} />
              <MarketStatRow label="Vol/MCap (24h)" value={data?.volMcapRatio ? `${data.volMcapRatio.toFixed(2)}%` : "--"} />

              <MarketStatRow label="Circulating Supply" value={fmtSupply(data?.circulatingSupply || 0)} />
              <MarketStatRow label="Total Supply" value={fmtSupply(data?.totalSupply || 0)} />

              <MarketStatRow label="Max Supply" value={data?.maxSupply ? fmtSupply(data.maxSupply) : "∞"} />
              <MarketStatRow label="All-Time High" value={fmtPrice(data?.ath || 0)} subtext={fmtDate(data?.athDate || "")} />

              <MarketStatRow label="All-Time Low" value={fmtPrice(data?.atl || 0)} subtext={fmtDate(data?.atlDate || "")} />
            </View>
          </View>
        </FadeSlideIn>
      ) : null}

      {/* ─── Stock Fundamentals (xStocks only, from Finnhub) ─── */}
      {stockData && asset.category === "stock" && (
        <FadeSlideIn delay={240}>
          <View style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>STOCK FUNDAMENTALS</Text>
              <Text style={styles.poolCount}>{stockData.ticker}</Text>
            </View>

            {/* Day's Range — from Finnhub quote */}
            {stockData.quote && stockData.quote.high > 0 && (
              <View style={mdStyles.rangeContainer}>
                <View style={mdStyles.rangeLabels}>
                  <Text style={mdStyles.rangeLabel}>Day's Range</Text>
                </View>
                <View style={mdStyles.rangeBarOuter}>
                  <View
                    style={[
                      mdStyles.rangeBarFill,
                      {
                        width: `${Math.max(0, Math.min(100,
                          ((stockData.quote.current - stockData.quote.low) /
                          (stockData.quote.high - stockData.quote.low || 1)) * 100
                        ))}%`,
                      },
                    ]}
                  />
                </View>
                <View style={mdStyles.rangeValues}>
                  <Text style={mdStyles.rangeValue}>${stockData.quote.low.toFixed(2)}</Text>
                  <Text style={mdStyles.rangeValue}>${stockData.quote.high.toFixed(2)}</Text>
                </View>
              </View>
            )}

            {/* Two-column fundamentals grid */}
            <View style={mdStyles.grid}>
              {stockData.quote && (
                <>
                  <MarketStatRow label="Previous Close" value={`$${stockData.quote.prevClose.toFixed(2)}`} />
                  <MarketStatRow label="Open" value={`$${stockData.quote.open.toFixed(2)}`} />
                </>
              )}
              {stockData.metrics && (
                <>
                  <MarketStatRow
                    label="Market Cap"
                    value={stockData.metrics.marketCap > 0
                      ? `$${(stockData.metrics.marketCap / 1000).toFixed(1)}B`
                      : "--"}
                  />
                  <MarketStatRow
                    label="P/E Ratio (TTM)"
                    value={stockData.metrics.peRatio > 0 ? stockData.metrics.peRatio.toFixed(2) : "--"}
                    subtext="Trailing 12 months"
                  />
                  <MarketStatRow
                    label="EPS (TTM)"
                    value={stockData.metrics.epsTTM ? `$${stockData.metrics.epsTTM.toFixed(2)}` : "--"}
                    subtext="Trailing 12 months"
                  />
                  <MarketStatRow
                    label="Beta (5Y)"
                    value={stockData.metrics.beta > 0 ? stockData.metrics.beta.toFixed(2) : "--"}
                    subtext="Monthly, 5-year"
                  />
                  <MarketStatRow
                    label="52 Week Range"
                    value={stockData.metrics.weekLow52 > 0
                      ? `$${stockData.metrics.weekLow52.toFixed(2)} – $${stockData.metrics.weekHigh52.toFixed(2)}`
                      : "--"}
                  />
                  <MarketStatRow
                    label="Dividend Yield"
                    value={stockData.metrics.dividendYield > 0
                      ? `${stockData.metrics.dividendYield.toFixed(2)}%`
                      : "N/A"}
                    subtext={stockData.metrics.dividendYield > 0 ? "Indicated annual" : "No dividend"}
                  />
                </>
              )}
              {stockData.earnings && (
                <MarketStatRow
                  label="Last Reported EPS"
                  value={`$${stockData.earnings.actual.toFixed(2)}`}
                  subtext={
                    (stockData.earnings.period ? `Q${stockData.earnings.quarter} ${stockData.earnings.year} · ` : "") +
                    (stockData.earnings.surprise > 0
                      ? `Beat est. by $${stockData.earnings.surprise.toFixed(2)}`
                      : stockData.earnings.surprise < 0
                      ? `Missed est. by $${Math.abs(stockData.earnings.surprise).toFixed(2)}`
                      : `Met estimate`)
                  }
                />
              )}
            </View>

            {/* Analyst Consensus Bar */}
            {stockData.recommendation && (
              <View style={{ marginTop: 12 }}>
                <Text style={[mdStyles.statLabel, { marginBottom: 8 }]}>Analyst Consensus</Text>
                <AnalystBar rec={stockData.recommendation} />
              </View>
            )}
          </View>
        </FadeSlideIn>
      )}

      {/* ─── Liquidity Pools ─── */}
      <FadeSlideIn delay={300}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{isStock ? "ON-CHAIN LIQUIDITY" : "LIQUIDITY POOLS"}</Text>
          {poolCount > 0 && (
            <Text style={styles.poolCount}>{poolCount} pool{poolCount !== 1 ? "s" : ""}</Text>
          )}
        </View>
      </FadeSlideIn>

      {data?.pairs && data.pairs.length > 0 ? (
        data.pairs.map((pair, i) => (
          <FadeSlideIn key={pair.pairAddress || i} delay={340 + i * 50}>
            <Pressable
              style={[
                styles.poolRow,
                i === 0 && styles.poolRowTop,
              ]}
              onPress={() => pair.url && Linking.openURL(pair.url)}
              android_ripple={{ color: "rgba(189,255,0,0.06)" }}
            >
              <View style={styles.poolLeft}>
                <View style={styles.poolDexRow}>
                  <Text style={[styles.poolDex, i === 0 && { color: C.green }]}>
                    {pair.dexId?.toUpperCase() || "DEX"}
                  </Text>
                  {i === 0 && (
                    <View style={styles.topBadge}>
                      <Text style={styles.topBadgeText}>TOP</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.poolPair}>
                  {pair.baseToken?.symbol}/{pair.quoteToken?.symbol}
                </Text>
              </View>
              <View style={styles.poolRight}>
                <Text style={styles.poolLiquidity}>{fmt(pair.liquidity?.usd || 0)} liq</Text>
                <Text style={styles.poolVolume}>{fmt(pair.volume?.h24 || 0)} vol</Text>
              </View>
              <Text style={{ color: C.muted, fontSize: 12, marginLeft: 8 }}>↗</Text>
            </Pressable>
          </FadeSlideIn>
        ))
      ) : (
        <FadeSlideIn delay={340}>
          <View style={styles.emptyCard}>
            <Text style={{ color: C.dimmed, fontSize: 18, marginBottom: 4 }}>~</Text>
            <Text style={styles.emptyText}>
              No pools found on DexScreener for {asset.symbol}
            </Text>
            {asset.category === "stable" && (
              <Text style={styles.emptySubtext}>
                Stablecoins trade across many pool pairs — try swapping directly
              </Text>
            )}
          </View>
        </FadeSlideIn>
      )}

      {/* Solscan Link */}
      <FadeSlideIn delay={340 + poolCount * 50 + 60}>
        <Pressable
          style={styles.solscanLink}
          onPress={() => Linking.openURL(`https://solscan.io/token/${asset.mint}`)}
          android_ripple={{ color: "rgba(189,255,0,0.06)" }}
        >
          <Text style={{ color: C.green, fontSize: 14 }}>◎</Text>
          <Text style={styles.solscanText}>View on Solscan</Text>
          <Text style={{ color: C.muted, fontSize: 12 }}>↗</Text>
        </Pressable>
      </FadeSlideIn>
    </View>
  );
}

// ─── Market Stat Row ──────────────────────────────────────
function MarketStatRow({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
  return (
    <View style={mdStyles.statCell}>
      <Text style={mdStyles.statLabel}>{label}</Text>
      <Text style={mdStyles.statValue}>{value}</Text>
      {subtext && <Text style={mdStyles.statSubtext}>{subtext}</Text>}
    </View>
  );
}

// ─── Analyst Consensus Bar ────────────────────────────────
function AnalystBar({ rec }: { rec: { buy: number; hold: number; sell: number; strongBuy: number; strongSell: number } }) {
  const total = rec.strongBuy + rec.buy + rec.hold + rec.sell + rec.strongSell;
  if (total === 0) return null;

  const buyPct = ((rec.strongBuy + rec.buy) / total) * 100;
  const holdPct = (rec.hold / total) * 100;
  const sellPct = ((rec.sell + rec.strongSell) / total) * 100;

  return (
    <View>
      <View style={{ flexDirection: "row", height: 6, gap: 2 }}>
        {buyPct > 0 && (
          <View style={{ flex: buyPct, backgroundColor: C.green, borderRadius: 1 }} />
        )}
        {holdPct > 0 && (
          <View style={{ flex: holdPct, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 1 }} />
        )}
        {sellPct > 0 && (
          <View style={{ flex: sellPct, backgroundColor: C.red, borderRadius: 1 }} />
        )}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
        <Text style={{ fontFamily: "Inter", fontSize: 11, color: C.green }}>
          Buy {rec.strongBuy + rec.buy}
        </Text>
        <Text style={{ fontFamily: "Inter", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          Hold {rec.hold}
        </Text>
        <Text style={{ fontFamily: "Inter", fontSize: 11, color: C.red }}>
          Sell {rec.sell + rec.strongSell}
        </Text>
      </View>
    </View>
  );
}

// ─── Market Data Styles ───────────────────────────────────
const mdStyles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statCell: {
    width: "50%",
    paddingVertical: 10,
    paddingRight: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderStyle: "dashed",
  },
  statLabel: {
    color: C.muted,
    fontFamily: "Inter",
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: C.white,
    fontFamily: "InterSemiBold",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  statSubtext: {
    color: C.dimmed,
    fontFamily: "Inter",
    fontSize: 10,
    marginTop: 2,
  },
  rangeContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginBottom: 4,
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rangeLabel: {
    color: C.muted,
    fontFamily: "Inter",
    fontSize: 11,
  },
  rangeBarOuter: {
    height: 4,
    backgroundColor: C.border,
    width: "100%",
    position: "relative",
  },
  rangeBarFill: {
    height: 4,
    backgroundColor: C.green,
  },
  rangeIndicator: {
    position: "absolute",
    top: -3,
    width: 2,
    height: 10,
    backgroundColor: C.white,
    marginLeft: -1,
  },
  rangeValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  rangeValue: {
    color: C.dimmed,
    fontFamily: "Inter",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
});

// ═══════════════════════════════════════════════════════════
// INFO TAB
// ═══════════════════════════════════════════════════════════
function InfoTab({
  meta,
  asset,
  riskLevel,
  copied,
  onCopyMint,
}: {
  meta: ReturnType<typeof getAssetMetadata> | undefined;
  asset: { symbol: string; name: string; category: string; mint: string };
  riskLevel: "Low" | "Medium" | "High";
  copied: boolean;
  onCopyMint: () => void;
}) {
  if (!meta) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No metadata available for {asset.symbol}</Text>
      </View>
    );
  }

  // Split description: first sentence = bold summary, rest = muted detail
  const descParts = meta.description.split(/(?<=\.)\s+/);
  const summary = descParts[0] || meta.description;
  const detail = descParts.length > 1 ? descParts.slice(1).join(" ") : "";

  return (
    <View>
      {/* Description — improved scanability */}
      <FadeSlideIn delay={100}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>ABOUT</Text>
          <Text style={styles.infoSummary}>{summary}</Text>
          {detail.length > 0 && <Text style={styles.infoDetail}>{detail}</Text>}
        </View>
      </FadeSlideIn>

      {/* Key Details */}
      <FadeSlideIn delay={180}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>KEY DETAILS</Text>
          <InfoRow label="Issuer" value={meta.issuer} />
          <InfoRow label="Custody" value={meta.custody} />
          <InfoRow label="Peg Mechanism" value={meta.peg} />

          {/* Mint Address — with Copy + Solscan actions */}
          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Mint Address</Text>
            <View style={styles.mintRow}>
              <Text style={styles.mintAddress}>
                {asset.mint.slice(0, 8)}...{asset.mint.slice(-6)}
              </Text>
              <Pressable style={styles.mintAction} onPress={onCopyMint}>
                <Text style={[styles.mintActionText, copied && { color: C.green }]}>
                  {copied ? "Copied ✓" : "Copy"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.mintAction}
                onPress={() => Linking.openURL(`https://solscan.io/token/${asset.mint}`)}
              >
                <Text style={styles.mintActionText}>Solscan ↗</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </FadeSlideIn>

      {/* Tags */}
      {meta.tags && meta.tags.length > 0 && (
        <FadeSlideIn delay={260}>
          <View style={styles.tagsRow}>
            {meta.tags.map((tag: string, i: number) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </FadeSlideIn>
      )}

      {/* Considerations — balanced view with mitigations */}
      {meta.risks && meta.risks.length > 0 && (
        <FadeSlideIn delay={320}>
          <View style={styles.infoCard}>
            <View style={styles.riskHeader}>
              <Text style={styles.infoLabel}>CONSIDERATIONS</Text>
              <RiskLevel level={riskLevel} />
            </View>
            {meta.risks.map((risk: string, i: number) => {
              const mitigation = (meta as any).mitigations?.[i];
              return (
                <View key={i} style={styles.riskRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                      <Text style={{ color: C.muted, fontSize: 11, marginRight: 8, marginTop: 2 }}>●</Text>
                      <Text style={styles.riskText}>{softenRisk(risk)}</Text>
                    </View>
                    {mitigation && (
                      <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 4, marginLeft: 19 }}>
                        <Text style={{ color: C.green, fontSize: 10, marginRight: 6, marginTop: 1 }}>✓</Text>
                        <Text style={{ fontFamily: "Inter", fontSize: 12, color: "rgba(189,255,0,0.7)", lineHeight: 17 }}>
                          {mitigation}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </FadeSlideIn>
      )}

      {/* Links */}
      {meta.links && meta.links.length > 0 && (
        <FadeSlideIn delay={400}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>RESOURCES</Text>
            {meta.links.map((link: { label: string; url: string }, i: number) => (
              <Pressable
                key={i}
                style={styles.linkRow}
                onPress={() => Linking.openURL(link.url)}
                android_ripple={{ color: "rgba(189,255,0,0.06)" }}
              >
                <Text style={{ color: C.green, fontSize: 12, marginRight: 6 }}>→</Text>
                <Text style={styles.linkText}>{link.label}</Text>
                <Text style={{ color: C.muted, fontSize: 12 }}>↗</Text>
              </Pressable>
            ))}
          </View>
        </FadeSlideIn>
      )}

      {/* xStock Disclaimer */}
      {asset.category === "stock" && (
        <FadeSlideIn delay={460}>
          <View style={[styles.infoCard, { borderColor: "rgba(255,68,68,0.3)" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: C.red, fontSize: 14, marginRight: 6 }}>⚠</Text>
              <Text style={[styles.infoLabel, { marginBottom: 0 }]}>REGULATORY NOTICE</Text>
            </View>
            <Text style={styles.disclaimerText}>
              Tokenized stocks provide price exposure only. Holders do not receive shareholder
              voting rights. Dividends are automatically reinvested into the token balance.
              xStocks are not available to US persons. Always verify regulatory status in your
              jurisdiction.
            </Text>
          </View>
        </FadeSlideIn>
      )}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoRowLabel}>{label}</Text>
      <Text style={styles.infoRowValue}>{value}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES — Brand V2
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 48 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerBack: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", marginLeft: 4 },
  headerSymbol: {
    color: C.white,
    fontFamily: "InterBold",
    fontSize: 18,
    letterSpacing: 0.3,
  },
  headerName: {
    color: C.muted,
    fontFamily: "Inter",
    fontSize: 12,
    marginTop: 1,
    maxWidth: SCREEN_WIDTH * 0.45,
  },
  headerBadge: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  headerBadgeText: {
    color: C.muted,
    fontFamily: "InterSemiBold",
    fontSize: 9,
    letterSpacing: 1,
  },

  // Price
  priceBanner: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  priceValue: {
    color: C.white,
    fontFamily: "InterBold",
    fontSize: 32,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
  },
  priceSecondRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  changePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeText: {
    fontFamily: "InterSemiBold",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  updatedText: {
    color: C.dimmed,
    fontFamily: "Inter",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },

  // Tabs
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: C.green },
  tabText: {
    color: C.muted,
    fontFamily: "InterSemiBold",
    fontSize: 13,
    letterSpacing: 1.5,
  },
  tabTextActive: { color: C.white },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },

  // Stats
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  statLabel: {
    color: C.muted,
    fontFamily: "Inter",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  statBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  statValue: {
    color: C.white,
    fontFamily: "InterBold",
    fontSize: 20,
    fontVariant: ["tabular-nums"],
  },

  // Pools
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: C.muted,
    fontFamily: "InterSemiBold",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  poolCount: {
    color: C.dimmed,
    fontFamily: "Inter",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  poolRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: C.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  poolRowTop: {
    backgroundColor: C.surface,
    borderLeftWidth: 2,
    borderLeftColor: C.green,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  poolLeft: { flex: 1 },
  poolDexRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  poolDex: {
    color: "#A855F7",
    fontFamily: "InterSemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  topBadge: {
    backgroundColor: C.green,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  topBadgeText: {
    color: "#000",
    fontFamily: "InterBold",
    fontSize: 8,
    letterSpacing: 0.5,
  },
  poolPair: { color: C.white, fontFamily: "Inter", fontSize: 14 },
  poolRight: { alignItems: "flex-end" },
  poolLiquidity: {
    color: C.white,
    fontFamily: "Inter",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    marginBottom: 2,
  },
  poolVolume: {
    color: C.muted,
    fontFamily: "Inter",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },

  // Empty
  emptyCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    alignItems: "center",
    gap: 4,
  },
  emptyText: { color: C.muted, fontFamily: "Inter", fontSize: 13, textAlign: "center" },
  emptySubtext: { color: C.dimmed, fontFamily: "Inter", fontSize: 11, textAlign: "center" },

  // Solscan
  solscanLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  solscanText: { color: C.green, fontFamily: "InterSemiBold", fontSize: 13, flex: 1 },

  // Info
  infoCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  infoLabel: {
    color: C.muted,
    fontFamily: "InterSemiBold",
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  infoSummary: {
    color: C.white,
    fontFamily: "InterSemiBold",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  infoDetail: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 20,
  },
  infoDescription: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 21,
  },
  infoRow: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingVertical: 12,
  },
  infoRowLabel: {
    color: C.muted,
    fontFamily: "Inter",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoRowValue: { color: C.white, fontFamily: "Inter", fontSize: 13, lineHeight: 19 },

  // Mint address
  mintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  mintAddress: {
    fontFamily: "InterSemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.3,
  },
  mintAction: {
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mintActionText: {
    fontFamily: "Inter",
    fontSize: 10,
    color: C.muted,
  },

  // Tags
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  tag: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: { color: C.muted, fontFamily: "Inter", fontSize: 11, letterSpacing: 0.5 },

  // Risks
  riskHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  riskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  riskText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter",
    fontSize: 13,
    flex: 1,
    lineHeight: 19,
  },

  // Links
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  linkText: { color: C.green, fontFamily: "Inter", fontSize: 13, flex: 1 },

  // Disclaimer
  disclaimerText: {
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 18,
  },

  // CTA
  ctaContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  ctaButton: {
    backgroundColor: C.green,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  ctaText: {
    color: "#000",
    fontFamily: "InterBold",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Error
  errorText: { color: C.muted, fontFamily: "Inter", fontSize: 15, marginBottom: 16 },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  backBtnText: { color: C.green, fontFamily: "InterSemiBold", fontSize: 14 },
});
