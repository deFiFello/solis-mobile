import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, Dimensions, Animated, Pressable,
  RefreshControl, ActivityIndicator, Easing, TextInput, LayoutAnimation,
  Platform, UIManager, NativeSyntheticEvent, NativeScrollEvent, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { getTokenPrices, getToken24hChanges, getSparkline24h } from "../../services/jupiterPrice";
import {
  getMacroData, getCryptoMetrics, getRwaOnSolana,
  type MacroDataPoint, type CryptoMetrics, type RwaData,
} from "../../services/macroData";
import { SOLIS_ASSETS } from "../../services/config";
import { useWallet } from "../../contexts/WalletProvider";
import { useSeeker } from "../../contexts/SeekerProvider";
import SolisLogo from "../../components/SolisLogo";
import TokenLogo from "../../components/TokenLogo";
import AnimatedPrice from "../../components/AnimatedPrice";
import Skeleton from "../../components/Skeleton";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 40;

// ─── Brand V2 ──────────────────────────────────────────────
const C = {
  bg: "#000000", surface: "#1A1A1A", border: "#2D2D2D",
  accent: "#BDFF00", white: "#FFFFFF",
  muted: "rgba(255,255,255,0.4)", mutedLight: "rgba(255,255,255,0.25)",
  mutedDim: "rgba(255,255,255,0.15)",
  purple: "rgba(140,100,200,0.8)", purpleBorder: "rgba(140,100,200,0.15)",
  red: "#f87171", green: "#4ade80", orange: "#fb923c", yellow: "#facc15",
};

const SECTION_HEADERS: Record<string, { label: string; sub?: string }> = {
  btc: { label: "Bitcoin Wrappers", sub: "Wrapped BTC on Solana" },
  crypto: { label: "Base Layer" },
  stable: { label: "Stablecoins", sub: "USD-pegged assets" },
  stock: { label: "xStocks", sub: "by Backed Finance" },
};
const CATEGORY_ORDER = ["btc", "crypto", "stable", "stock"];

// ─── Helpers ───────────────────────────────────────────────
function fmtPrice(p: number | null | undefined): string {
  if (!p) return "--";
  if (p >= 10000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(6)}`;
}
function fmtUsd(v: number): string {
  if (v === 0) return "$0.00";
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1000) return `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `$${v.toFixed(2)}`;
}
function fmtAmt(a: number): string {
  if (a === 0) return "0";
  if (a >= 1000) return a.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (a >= 1) return a.toFixed(2);
  if (a >= 0.001) return a.toFixed(4);
  return a.toFixed(6);
}
function fmtB(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(2)}T`;
  if (v >= 1) return `$${v.toFixed(0)}B`;
  return `$${(v * 1000).toFixed(0)}M`;
}
function fmtM(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${(v / 1e3).toFixed(0)}K`;
}

// ═══════════════════════════════════════════════════════════
// MINI PNL SPARKLINE — generates a plausible 24h curve
// ═══════════════════════════════════════════════════════════
// Real 24h sparkline — fetches actual price history from CoinGecko
function Sparkline24h({ symbol, color }: { symbol: string; color: string }) {
  const CHART_W = CARD_WIDTH - 40;
  const CHART_H = 44;
  const [points, setPoints] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getSparkline24h(symbol);
        if (!cancelled && data.length > 0) {
          // Downsample to ~60 points for smooth rendering
          const step = Math.max(1, Math.floor(data.length / 60));
          const sampled = data.filter((_: number, i: number) => i % step === 0);
          setPoints(sampled);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [symbol]);

  if (points.length < 2) {
    // Loading placeholder — thin dashed line
    return (
      <View style={{ height: CHART_H, marginTop: 12, justifyContent: "center" }}>
        <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
      </View>
    );
  }

  const maxVal = Math.max(...points);
  const minVal = Math.min(...points);
  const range = maxVal - minVal || 1;
  const segW = CHART_W / (points.length - 1);

  return (
    <View style={{ height: CHART_H, width: CHART_W, marginTop: 12 }}>
      {/* Fill area under the line */}
      {points.map((pt, i) => {
        const normalized = (pt - minVal) / range;
        const h = Math.max(1, normalized * (CHART_H - 2));
        return (
          <View key={`f${i}`} style={{
            position: "absolute", left: i * segW, bottom: 0,
            width: segW + 0.5, height: h,
            backgroundColor: color, opacity: 0.06 + (i / points.length) * 0.12,
          }} />
        );
      })}
      {/* Line segments connecting each point */}
      {points.map((pt, i) => {
        if (i === 0) return null;
        const y1 = ((points[i - 1] - minVal) / range) * (CHART_H - 2);
        const y2 = ((pt - minVal) / range) * (CHART_H - 2);
        const x1 = (i - 1) * segW;
        // Approximate line with a thin positioned view
        const midY = (y1 + y2) / 2;
        return (
          <View key={`l${i}`} style={{
            position: "absolute",
            left: x1, bottom: midY,
            width: segW + 0.5, height: 1.5,
            backgroundColor: color,
            opacity: 0.3 + (i / points.length) * 0.7,
            transform: [{ rotate: `${Math.atan2(y1 - y2, segW) }rad` }],
          }} />
        );
      })}
      {/* Current price dot */}
      <View style={{
        position: "absolute",
        right: 0,
        bottom: ((points[points.length - 1] - minVal) / range) * (CHART_H - 2) - 2.5,
        width: 5, height: 5, borderRadius: 2.5,
        backgroundColor: color,
      }} />
      {/* Price range labels */}
      <Text style={{ position: "absolute", top: 0, right: 0, fontFamily: "SpaceMono", fontSize: 7, color: "rgba(255,255,255,0.15)" }}>
        {fmtPrice(maxVal)}
      </Text>
      <Text style={{ position: "absolute", bottom: 0, right: 0, fontFamily: "SpaceMono", fontSize: 7, color: "rgba(255,255,255,0.15)" }}>
        {fmtPrice(minVal)}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// CONNECT WALLET CARD — animated prompt
// ═══════════════════════════════════════════════════════════
function ConnectWalletCard({ onConnect }: { onConnect: () => void }) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow pulse on Solis mark
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Shimmer sweep across button
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(2000),
      ])
    ).start();
  }, []);

  const shimmerX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, CARD_WIDTH],
  });

  return (
    <Pressable style={[s.flipCardWrap, { height: 220 }]} onPress={onConnect}>
      <View style={[s.card, s.portfolioCard, { height: "100%", padding: 24 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={{ fontFamily: "InterBold", fontSize: 22, color: C.white, letterSpacing: -0.5 }}>Trade 22 assets</Text>
            <Text style={{ fontFamily: "InterBold", fontSize: 22, color: C.accent, letterSpacing: -0.5 }}>24/7. Self-custody.</Text>
          </View>
          <Animated.View style={{ opacity: pulseAnim }}>
            <SolisLogo variant="mark" size={28} color="green" />
          </Animated.View>
        </View>
        <View style={{ marginTop: 16, gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 4, height: 4, backgroundColor: C.accent }} />
            <Text style={{ fontFamily: "Inter", fontSize: 11, color: C.muted }}>BTC wrappers · Stablecoins · Tokenized stocks</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 4, height: 4, backgroundColor: C.accent }} />
            <Text style={{ fontFamily: "Inter", fontSize: 11, color: C.muted }}>Jupiter routing · ZK privacy · Seeker fee tiers</Text>
          </View>
        </View>
        <View style={{ marginTop: "auto" }}>
          <View style={[s.connectCardBtn, { alignSelf: "flex-start", paddingHorizontal: 28, overflow: "hidden" }]}>
            <Text style={s.connectCardBtnText}>CONNECT WALLET</Text>
            {/* Shimmer sweep */}
            <Animated.View style={{
              position: "absolute", top: 0, bottom: 0, width: 60,
              backgroundColor: "rgba(189,255,0,0.12)",
              transform: [{ translateX: shimmerX }],
            }} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════
// PORTFOLIO FLIP CARD
// ═══════════════════════════════════════════════════════════
function PortfolioFlipCard({
  prices, changes24h,
}: {
  prices: Record<string, number>;
  changes24h: Record<string, number>;
}) {
  const { isConnected, balances, connect } = useWallet();
  const { seekerMode, feeTier } = useSeeker();
  const router = useRouter();
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

  const holdings = useMemo(() =>
    Object.entries(balances)
      .filter(([_, amt]) => amt > 0)
      .map(([sym, amt]) => {
        const price = prices[sym] || 0;
        const usd = price * amt;
        const change = changes24h[sym] || 0;
        const pnl = usd * (change / 100);
        return { symbol: sym, amount: amt, price, usd, change, pnl };
      })
      .sort((a, b) => b.usd - a.usd),
    [balances, prices, changes24h]
  );

  const totalUsd = holdings.reduce((s, h) => s + h.usd, 0);
  const totalPnl = holdings.reduce((s, h) => s + h.pnl, 0);
  const totalPnlPct = totalUsd > 0 ? (totalPnl / (totalUsd - totalPnl)) * 100 : 0;
  const topPerformer = holdings.length > 0
    ? holdings.reduce((best, h) => h.change > best.change ? h : best, holdings[0])
    : null;

  const flipCard = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      friction: 8, tension: 12, useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [0, 0, 1, 1] });

  const pnlColor = totalPnl >= 0 ? C.green : C.red;
  const pnlArrow = totalPnl >= 0 ? "▲" : "▼";

  // Dynamic heights
  const FRONT_H = 220;
  const backRows = Math.max(holdings.length, 1);
  const BACK_H = Math.min(60 + backRows * 44 + (holdings.length === 0 ? 40 : 16), 300);
  const cardH = isFlipped ? BACK_H : FRONT_H;

  if (!isConnected) {
    return <ConnectWalletCard onConnect={connect} />;
  }

  // ─── Front ───────────────────────────────
  const frontCard = (
    <Animated.View
      style={[s.card, s.portfolioCard, { height: FRONT_H, position: "absolute", width: "100%",
        transform: [{ rotateY: frontRotate }], opacity: frontOpacity, backfaceVisibility: "hidden",
      }]}
    >
      <Pressable style={{ flex: 1 }} onPress={flipCard}>
        <View style={s.cardTopRow}>
          <View>
            <Text style={s.portfolioLabel}>PORTFOLIO</Text>
            <Text style={s.portfolioTotal}>{fmtUsd(totalUsd)}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            {seekerMode && <View style={s.seekerBadge}><Text style={s.seekerBadgeText}>SEEKER</Text></View>}
            <Text style={{ fontFamily: "Inter", fontSize: 9, color: C.mutedDim }}>
              {holdings.length} asset{holdings.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {totalPnl !== 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
            <Text style={[s.pnlValue, { color: pnlColor }]}>{pnlArrow} {fmtUsd(Math.abs(totalPnl))}</Text>
            <Text style={[s.pnlPct, { color: pnlColor }]}>({totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}%)</Text>
            <Text style={s.pnlLabel}>24h</Text>
          </View>
        )}

        {/* Real 24h sparkline of largest holding */}
        {holdings.length > 0 && (
          <Sparkline24h symbol={holdings[0].symbol} color={totalPnl >= 0 ? C.green : C.red} />
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
          <Text style={s.flipHint}>tap for holdings →</Text>
          {topPerformer && topPerformer.change !== 0 && (
            <Text style={{ fontFamily: "SpaceMono", fontSize: 9, color: topPerformer.change >= 0 ? C.green : C.red }}>
              {topPerformer.symbol} {topPerformer.change >= 0 ? "▲" : "▼"}{Math.abs(topPerformer.change).toFixed(1)}%
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );

  // ─── Back ────────────────────────────────
  const backCard = (
    <Animated.View
      style={[s.card, s.portfolioCard, { height: BACK_H, position: "absolute", width: "100%",
        transform: [{ rotateY: backRotate }], opacity: backOpacity, backfaceVisibility: "hidden",
      }]}
    >
      <Pressable style={{ flex: 1 }} onPress={flipCard}>
        <View style={s.cardTopRow}>
          <Text style={s.portfolioLabel}>HOLDINGS</Text>
          <Text style={s.flipHint}>← flip back</Text>
        </View>
        <ScrollView style={{ flex: 1, marginTop: 8 }} showsVerticalScrollIndicator={false}>
          {holdings.map((h, idx) => (
            <View key={h.symbol} style={[s.holdingMini, idx < holdings.length - 1 && { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }]}>
              <TokenLogo symbol={h.symbol} size={22} />
              <Text style={s.holdingMiniSymbol}>{h.symbol}</Text>
              <Text style={s.holdingMiniAmount}>{fmtAmt(h.amount)}</Text>
              <View style={{ alignItems: "flex-end", flex: 1 }}>
                <Text style={s.holdingMiniUsd}>{fmtUsd(h.usd)}</Text>
                <Text style={{ fontFamily: "SpaceMono", fontSize: 9, color: h.pnl >= 0 ? C.green : C.red }}>
                  {h.pnl >= 0 ? "+" : ""}{fmtUsd(Math.abs(h.pnl))}
                </Text>
              </View>
            </View>
          ))}
          {holdings.length === 0 && (
            <Pressable onPress={() => router.push("/swap")} style={{ alignItems: "center", paddingTop: 16 }}>
              <Text style={{ fontFamily: "Inter", fontSize: 11, color: C.mutedDim }}>No supported assets</Text>
              <Text style={{ fontFamily: "InterMedium", fontSize: 11, color: C.accent, marginTop: 8 }}>Swap to add assets →</Text>
            </Pressable>
          )}
        </ScrollView>
      </Pressable>
    </Animated.View>
  );

  return <View style={[s.flipCardWrap, { height: cardH }]}>{backCard}{frontCard}</View>;
}

// ═══════════════════════════════════════════════════════════
// SHADOW CARD
// ═══════════════════════════════════════════════════════════
function ShadowCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={[s.card, s.shadowCard, { height: 220 }]} onPress={onPress}>
      <View style={s.cardTopRow}>
        <View style={s.row}>
          <Image
            source={require("../../assets/logos/privacycash.png")}
            style={{ width: 24, height: 24, borderRadius: 12 }}
            resizeMode="contain"
          />
          <Text style={s.shadowLabel}>PRIVACYCASH</Text>
        </View>
        <View style={s.comingSoonBadge}><Text style={s.comingSoonText}>COMING SOON</Text></View>
      </View>
      <View>
        <Text style={s.shadowTitle}>Shadow Swaps</Text>
        <Text style={s.shadowDesc}>ZK-shielded transactions. Break the link between your wallet and your trades.</Text>
      </View>
      <Text style={s.shadowCta}>Learn more →</Text>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════
// MARKET PULSE
// ═══════════════════════════════════════════════════════════
type StructureView = "ALL" | "EX_BTC" | "EX_STABLES";

function MarketPulse({
  metrics, macroData, rwa,
}: {
  metrics: CryptoMetrics; macroData: MacroDataPoint[]; rwa: RwaData;
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [structureView, setStructureView] = useState<StructureView>("ALL");

  const toggle = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(expandedSection === key ? null : key);
  };

  const switchView = (v: StructureView) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStructureView(v);
  };

  const { fearGreed, btcDominance, totalMarketCap, totalMarketCapChange24h,
    stablecoinMarketCap, stablecoinDominance } = metrics;
  const dxy = macroData.find((d: MacroDataPoint) => d.label === "DXY");
  const dxyVal = dxy?.value !== "--" ? dxy?.value : null;
  const dxyChg = dxy?.change !== "--" ? dxy?.change : null;

  // Fear & Greed
  const fgColor = !fearGreed ? C.mutedLight
    : fearGreed.value <= 25 ? C.red : fearGreed.value <= 50 ? C.orange
    : fearGreed.value <= 75 ? C.yellow : C.accent;
  const fgFill = fearGreed ? Math.round(fearGreed.value / 10) : 0;

  // Structure computed
  const totalB = (totalMarketCap || 0) * 1000;
  const btcB = totalB * ((btcDominance || 0) / 100);
  const stableB = stablecoinMarketCap || 0;
  const altB = totalB - btcB - stableB;

  let displayDom: number, displayMcap: number, domLabel: string, mcapLabel: string;
  if (structureView === "EX_BTC") {
    displayDom = 100 - (btcDominance || 0); domLabel = "Altcoin Share";
    displayMcap = totalB - btcB; mcapLabel = "Altcoin Cap";
  } else if (structureView === "EX_STABLES") {
    const stDom = stablecoinDominance || 0;
    displayDom = 100 - stDom; domLabel = "Crypto Share";
    displayMcap = totalB - stableB; mcapLabel = "Crypto Cap";
  } else {
    displayDom = btcDominance || 0; domLabel = "BTC Dominance";
    displayMcap = totalB; mcapLabel = "Total Mkt Cap";
  }

  const mcapChgColor = totalMarketCapChange24h
    ? (totalMarketCapChange24h >= 0 ? C.green : C.red) : C.muted;

  // ─── View-specific sentiment ─────────────
  const getSentiment = (): string => {
    if (!totalMarketCapChange24h || !btcDominance) return "";
    const chg = totalMarketCapChange24h;
    const dir = chg > 0 ? "up" : chg < -0.5 ? "down" : "flat";
    const chgStr = `${chg >= 0 ? "+" : ""}${chg.toFixed(1)}%`;
    const domStr = btcDominance.toFixed(0);

    if (structureView === "EX_BTC") {
      const altCapStr = fmtB(totalB - btcB);
      if (dir === "down") return `Altcoins at ${altCapStr}, market ${chgStr}. BTC at ${domStr}% dominance — alts typically underperform when BTC absorbs capital.`;
      if (dir === "up") return `Altcoins at ${altCapStr}, market ${chgStr}. BTC dominance at ${domStr}% — watch for decline as capital rotates into alts.`;
      return `Altcoins at ${altCapStr}. Consolidation phase with ${domStr}% BTC dominance.`;
    }

    if (structureView === "EX_STABLES") {
      const riskStr = fmtB(totalB - stableB);
      const stableStr = fmtB(stableB);
      const stPct = totalB > 0 ? ((stableB / totalB) * 100).toFixed(0) : "0";
      if (dir === "down") return `${riskStr} in risk assets (${chgStr}). ${stableStr} (${stPct}%) sidelined in stablecoins.`;
      if (dir === "up") return `${riskStr} in risk assets (${chgStr}). ${stableStr} (${stPct}%) in stablecoins — capital moving from sidelines into risk.`;
      return `${riskStr} in risk assets. ${stableStr} (${stPct}%) sidelined in stablecoins.`;
    }

    // ALL
    if (dir === "down") return `Market ${chgStr} in 24h. BTC dominance at ${domStr}% — capital consolidating into BTC.`;
    if (dir === "up") return `Market ${chgStr} in 24h. BTC dominance at ${domStr}% — ${btcDominance > 55 ? "BTC leading" : "broad rally across assets"}.`;
    return `Market flat. BTC dominance at ${domStr}%.`;
  };

  // ─── View-specific breakdown ─────────────
  const getBreakdown = () => {
    if (structureView === "EX_BTC") {
      const deFiEst = altB * 0.15; // rough DeFi share
      const l1Est = altB * 0.45; // L1/L2 share
      const otherEst = altB - deFiEst - l1Est;
      return [
        { label: "L1 & L2 Tokens", val: fmtB(l1Est) },
        { label: "DeFi Protocols", val: fmtB(deFiEst) },
        { label: "Other Alts", val: fmtB(otherEst) },
        { label: "BTC (excluded)", val: fmtB(btcB), dim: true },
      ];
    }
    if (structureView === "EX_STABLES") {
      const btcPctOfRisk = totalB - stableB > 0 ? ((btcB / (totalB - stableB)) * 100).toFixed(1) : "0";
      const altPctOfRisk = totalB - stableB > 0 ? ((altB / (totalB - stableB)) * 100).toFixed(1) : "0";
      return [
        { label: `BTC (${btcPctOfRisk}% of risk)`, val: fmtB(btcB) },
        { label: `Altcoins (${altPctOfRisk}% of risk)`, val: fmtB(altB) },
        { label: "Stablecoins (excluded)", val: fmtB(stableB), dim: true },
      ];
    }
    return [
      { label: "BTC", val: fmtB(btcB) },
      { label: "Altcoins", val: fmtB(altB) },
      { label: "Stablecoins", val: fmtB(stableB) },
    ];
  };

  // RWA
  const hasSolRwa = rwa.solanaRwa != null && rwa.solanaRwa > 0;
  const hasTotalRwa = rwa.totalRwa != null && rwa.totalRwa > 0;
  const solPct = hasSolRwa && hasTotalRwa ? ((rwa.solanaRwa! / rwa.totalRwa!) * 100).toFixed(1) : null;

  return (
    <View style={s.pulseCard}>
      <Text style={s.pulseTitle}>MARKET PULSE</Text>

      {/* ─── Sentiment strip ─────────────────── */}
      <Pressable style={s.pulseSection} onPress={() => toggle("sentiment")}>
        <View style={s.sentimentRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.pulseMiniLabel}>Fear & Greed</Text>
            {fearGreed ? (
              <>
                <View style={s.fgBarRow}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <View key={i} style={[s.fgSeg, { backgroundColor: i < fgFill ? fgColor : "rgba(255,255,255,0.06)" }]} />
                  ))}
                </View>
                <Text style={[s.sentimentVal, { color: fgColor }]}>
                  {fearGreed.value} <Text style={s.sentimentSmall}>· {fearGreed.label}</Text>
                </Text>
              </>
            ) : <Skeleton width={60} height={14} style={{ marginTop: 4 }} />}
          </View>
          <View style={s.vDivider} />
          <View style={{ flex: 0.7, alignItems: "flex-end" }}>
            <Text style={s.pulseMiniLabel}>DXY</Text>
            {dxyVal ? (
              <>
                <Text style={s.sentimentVal}>{dxyVal}</Text>
                {dxyChg && <Text style={[s.sentimentChg, { color: dxyChg.startsWith("+") ? C.green : C.red }]}>{dxyChg}</Text>}
              </>
            ) : <Skeleton width={50} height={14} style={{ marginTop: 4 }} />}
          </View>
        </View>

        {expandedSection === "sentiment" && (
          <View style={s.expandBody}>
            <Text style={s.expandText}>
              Fear & Greed below 20 signals extreme fear — historically, recovery often follows. Above 80 means euphoria, which often precedes corrections. Based on volatility, volume, social sentiment, and BTC dominance.
            </Text>
            <View style={s.hDivider} />
            <Text style={s.expandText}>
              DXY measures dollar strength against 6 major currencies. A rising DXY is typically bearish for crypto — stronger dollar means less incentive to hold risk assets. Below 100 signals dollar weakness, historically bullish for BTC.
            </Text>
          </View>
        )}
      </Pressable>

      <View style={s.hDivider} />

      {/* ─── Structure ───────────────────────── */}
      <Pressable style={s.pulseSection} onPress={() => toggle("structure")}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={s.pulseSectionTitle}>STRUCTURE</Text>
          <View style={s.toggleRow}>
            {(["ALL", "EX_BTC", "EX_STABLES"] as StructureView[]).map((v) => (
              <Pressable key={v} style={[s.togglePill, structureView === v && s.toggleActive]} onPress={() => switchView(v)}>
                <Text style={[s.toggleText, structureView === v && s.toggleTextActive]}>
                  {v === "ALL" ? "ALL" : v === "EX_BTC" ? "EX-BTC" : "EX-STABLE"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {totalMarketCap ? (
          <>
            <View style={s.structureGrid}>
              <View style={{ flex: 1 }}>
                <Text style={s.structureLabel}>{domLabel}</Text>
                <Text style={s.structureNum}>{displayDom.toFixed(1)}%</Text>
              </View>
              <View style={s.vDivider} />
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={s.structureLabel}>{mcapLabel}</Text>
                <Text style={s.structureNum}>{fmtB(displayMcap)}</Text>
                {totalMarketCapChange24h != null && (
                  <Text style={{ fontFamily: "SpaceMono", fontSize: 9, color: mcapChgColor, marginTop: 2 }}>
                    {totalMarketCapChange24h >= 0 ? "▲" : "▼"} {Math.abs(totalMarketCapChange24h).toFixed(1)}% · 24h
                  </Text>
                )}
              </View>
              <View style={s.vDivider} />
              <View style={{ flex: 0.7, alignItems: "flex-end" }}>
                <Text style={s.structureLabel}>{structureView === "ALL" ? "Stables" : "24h"}</Text>
                {structureView === "ALL" ? (
                  <Text style={s.structureNum}>{fmtB(stableB)}</Text>
                ) : (
                  <Text style={[s.structureNum, { color: mcapChgColor }]}>
                    {totalMarketCapChange24h != null
                      ? `${totalMarketCapChange24h >= 0 ? "▲" : "▼"}${Math.abs(totalMarketCapChange24h).toFixed(1)}%`
                      : "--"
                    }
                  </Text>
                )}
              </View>
            </View>
          </>
        ) : <Skeleton width={200} height={20} style={{ marginTop: 8 }} />}

        {expandedSection === "structure" && (
          <View style={s.expandBody}>
            <Text style={s.expandText}>{getSentiment()}</Text>
            <View style={s.hDivider} />
            {getBreakdown().map((row, i) => (
              <View key={i} style={s.breakdownRow}>
                <Text style={[s.breakdownLabel, row.dim && { color: C.mutedDim }]}>{row.label}</Text>
                <Text style={[s.breakdownVal, row.dim && { color: C.mutedDim }]}>{row.val}</Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>

      <View style={s.hDivider} />

      {/* ─── RWA ─────────────────────────────── */}
      <Pressable style={s.pulseSection} onPress={() => toggle("rwa")}>
        <Text style={s.pulseSectionTitle}>RWA ON SOLANA</Text>
        {hasSolRwa ? (
          <View style={{ marginTop: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <Text style={s.rwaValue}>{fmtM(rwa.solanaRwa!)}</Text>
              <Text style={s.rwaContext}>tokenized on Solana</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              <Text style={s.rwaSub}>
                {solPct}% of {hasTotalRwa ? fmtM(rwa.totalRwa!) : "--"} global on-chain RWA · {rwa.protocolCount} protocols
              </Text>
              {rwa.growthPct != null && rwa.growthPeriod && (
                <Text style={{
                  fontFamily: "SpaceMono", fontSize: 9,
                  color: rwa.growthPct >= 0 ? C.green : C.red,
                }}>
                  {rwa.growthPct >= 0 ? "▲" : "▼"}{Math.abs(rwa.growthPct).toFixed(1)}% {rwa.growthPeriod}
                </Text>
              )}
            </View>
            <Text style={s.rwaCta}>Trade tokenized stocks, bonds & real estate 24/7 →</Text>
          </View>
        ) : <Skeleton width={160} height={18} style={{ marginTop: 8 }} />}

        {expandedSection === "rwa" && (
          <View style={s.expandBody}>
            <Text style={s.expandText}>
              Real World Assets are tokenized versions of traditional financial instruments — equities, treasuries, bonds, real estate. When institutions tokenize assets on Solana, it signals trust in the network's speed, cost, and finality.
            </Text>
            <View style={s.hDivider} />
            <Text style={s.expandText}>
              Solis connects you to these markets. Trade xStocks by Backed Finance, stablecoins backed by treasuries, and more — all self-custody, all on-chain.
            </Text>
            <Text style={s.expandSource}>Source: DefiLlama</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// SCROLLING TICKER — memoized to prevent animation resets
// ═══════════════════════════════════════════════════════════
function MarketTicker({ data }: { data: MacroDataPoint[] }) {
  const animVal = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const dataLen = data.length;

  useEffect(() => {
    if (dataLen === 0) return;
    const w = dataLen * 160;
    animVal.setValue(0);
    loopRef.current?.stop();
    loopRef.current = Animated.loop(
      Animated.timing(animVal, { toValue: -w, duration: w * 30, easing: Easing.linear, useNativeDriver: true })
    );
    loopRef.current.start();
    return () => { loopRef.current?.stop(); };
  }, [dataLen]);

  const tripled = useMemo(() => [...data, ...data, ...data], [data]);

  if (data.length === 0) {
    return <View style={s.tickerWrap}><View style={{ flexDirection: "row", justifyContent: "center", gap: 16 }}>
      <Skeleton width={100} height={12} /><Skeleton width={100} height={12} /><Skeleton width={100} height={12} />
    </View></View>;
  }

  return (
    <View style={s.tickerWrap}>
      <Animated.View style={{ flexDirection: "row", transform: [{ translateX: animVal }] }}>
        {tripled.map((item: MacroDataPoint, idx: number) => (
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

// ═══════════════════════════════════════════════════════════
// HOLDING ROW + TABS + SEARCH + SECTION
// ═══════════════════════════════════════════════════════════
function HoldingRow({ symbol, name, price, change24h, balance, loading, onPress }: {
  symbol: string; name: string; price: number | null; change24h: number | null; balance: number; loading: boolean; onPress?: () => void;
}) {
  const chgColor = change24h != null ? (change24h >= 0 ? C.green : C.red) : C.muted;
  return (
    <Pressable style={s.holdingRow} android_ripple={{ color: "rgba(189,255,0,0.06)" }} onPress={onPress}>
      <TokenLogo symbol={symbol} size={38} />
      <View style={s.holdingInfo}>
        <View style={s.holdingTopRow}>
          <Text style={s.holdingSymbol}>{symbol}</Text>
          {loading && !price ? <Skeleton width={70} height={16} /> : <AnimatedPrice value={fmtPrice(price)} style={s.holdingPrice} />}
        </View>
        <View style={s.holdingBottomRow}>
          <Text style={s.holdingName}>{name}</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            {balance > 0 && <Text style={s.holdingBalance}>{fmtAmt(balance)}</Text>}
            {change24h != null && change24h !== 0 && (
              <Text style={{ fontFamily: "SpaceMono", fontSize: 10, color: chgColor }}>
                {change24h >= 0 ? "+" : ""}{change24h.toFixed(1)}%
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function AssetTabs({ active, onPress }: { active: string; onPress: (t: string) => void }) {
  return (
    <View style={s.tabRow}>
      {["ALL", "CRYPTO", "STABLES", "STOCKS"].map((t: string) => (
        <Pressable key={t} onPress={() => onPress(t)} style={[s.tab, active === t && s.tabActive]}>
          <Text style={[s.tabText, active === t && s.tabTextActive]}>{t}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionLabel}>{label}</Text>
      {sub && <Text style={s.sectionSub}>{sub}</Text>}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isConnected, isConnecting, address, connect, disconnect, balances, refreshBalances } = useWallet();

  const [prices, setPrices] = useState<Record<string, number>>({});
  const [changes24h, setChanges24h] = useState<Record<string, number>>({});
  const [macroData, setMacroData] = useState<MacroDataPoint[]>([]);
  const [cryptoMetrics, setCryptoMetrics] = useState<CryptoMetrics>({
    fearGreed: null, btcDominance: null, totalMarketCap: null,
    totalMarketCapChange24h: null, stablecoinMarketCap: null, stablecoinDominance: null,
  });
  const [rwaData, setRwaData] = useState<RwaData>({ solanaRwa: null, totalRwa: null, protocolCount: 0, growthPct: null, growthPeriod: null });
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<ScrollView>(null);
  const [activeCard, setActiveCard] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [priceData, macro, metrics] = await Promise.all([
        getTokenPrices(), getMacroData(), getCryptoMetrics(),
      ]);
      if (Object.keys(priceData).length > 0) setPrices(priceData);
      setChanges24h(getToken24hChanges());
      if (macro.length > 0) setMacroData(macro);
      setCryptoMetrics(metrics);
    } catch (err) {
      console.error("[Home] fetch error:", err);
    } finally { setLoading(false); }
  }, []);

  const fetchRwa = useCallback(async () => {
    try { setRwaData(await getRwaOnSolana()); } catch {}
  }, []);

  useEffect(() => {
    fetchData(); fetchRwa();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData, fetchRwa]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchRwa(), refreshBalances()]);
    setRefreshing(false);
  };

  const onCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveCard(Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH));
  };

  const filteredAssets = useMemo(() =>
    SOLIS_ASSETS.filter((a: typeof SOLIS_ASSETS[number]) => {
      if (activeTab === "CRYPTO") return a.category === "crypto" || a.category === "btc";
      if (activeTab === "STABLES") return a.category === "stable";
      if (activeTab === "STOCKS") return a.category === "stock";
      return true;
    }).filter((a: typeof SOLIS_ASSETS[number]) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
    }),
    [activeTab, searchQuery]
  );

  const showSections = activeTab === "ALL" && !searchQuery;
  const groupedAssets = useMemo(() => {
    if (!showSections) return [];
    return CATEGORY_ORDER
      .map(cat => ({ category: cat, assets: filteredAssets.filter((a: typeof SOLIS_ASSETS[number]) => a.category === cat) }))
      .filter(g => g.assets.length > 0);
  }, [filteredAssets, showSections]);

  // Ticker with crypto
  const macroWithCrypto = useMemo<MacroDataPoint[]>(() => [
    ...macroData,
    ...(prices["SOL"] ? [{ label: "SOL", value: `$${prices["SOL"].toFixed(2)}`, change: changes24h["SOL"] != null ? `${changes24h["SOL"] >= 0 ? "+" : ""}${changes24h["SOL"].toFixed(1)}%` : "--", up: (changes24h["SOL"] || 0) >= 0 }] : []),
    ...(prices["cbBTC"] ? [{ label: "BTC", value: `$${prices["cbBTC"].toLocaleString("en-US", { maximumFractionDigits: 0 })}`, change: changes24h["cbBTC"] != null ? `${changes24h["cbBTC"] >= 0 ? "+" : ""}${changes24h["cbBTC"].toFixed(1)}%` : "--", up: (changes24h["cbBTC"] || 0) >= 0 }] : []),
  ], [macroData, prices, changes24h]);

  const renderAssetList = () => {
    if (showSections) {
      return groupedAssets.map((g) => (
        <View key={g.category}>
          <SectionHeader label={SECTION_HEADERS[g.category]?.label || g.category} sub={SECTION_HEADERS[g.category]?.sub} />
          {g.assets.map((a: typeof SOLIS_ASSETS[number], i: number) => (
            <View key={a.symbol} style={i < g.assets.length - 1 ? s.holdingBorder : undefined}>
              <HoldingRow symbol={a.symbol} name={a.name} price={prices[a.symbol] || null}
                change24h={changes24h[a.symbol] ?? null}
                balance={balances[a.symbol] || 0} loading={loading}
                onPress={() => router.push(`/asset/${a.symbol}`)} />
            </View>
          ))}
        </View>
      ));
    }
    return filteredAssets.map((a: typeof SOLIS_ASSETS[number], i: number) => (
      <View key={a.symbol} style={i < filteredAssets.length - 1 ? s.holdingBorder : undefined}>
        <HoldingRow symbol={a.symbol} name={a.name} price={prices[a.symbol] || null}
          change24h={changes24h[a.symbol] ?? null}
          balance={balances[a.symbol] || 0} loading={loading}
          onPress={() => router.push(`/asset/${a.symbol}`)} />
      </View>
    ));
  };

  return (
    <ScrollView
      style={[s.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
    >
      <View style={s.header}>
        <SolisLogo variant="horizontal" size={22} color="white" />
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

      <ScrollView
        ref={carouselRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onScroll={onCarouselScroll} scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        snapToInterval={CARD_WIDTH + 16} decelerationRate="fast"
      >
        <View style={{ width: CARD_WIDTH, marginRight: 16 }}>
          <PortfolioFlipCard prices={prices} changes24h={changes24h} />
        </View>
        <View style={{ width: CARD_WIDTH }}>
          <ShadowCard onPress={() => router.push("/swap")} />
        </View>
      </ScrollView>

      <View style={s.dotsRow}>
        <View style={[s.dot, activeCard === 0 ? s.dotActive : s.dotInactive]} />
        <View style={[s.dot, activeCard === 1 ? s.dotShadowActive : s.dotShadowInactive]} />
      </View>

      <View style={{ marginTop: 16 }}><MarketTicker data={macroWithCrypto} /></View>

      <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
        <MarketPulse metrics={cryptoMetrics} macroData={macroData} rwa={rwaData} />
      </View>

      <AssetTabs active={activeTab} onPress={setActiveTab} />

      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>⌕</Text>
        <TextInput style={s.searchInput} placeholder="Search assets..." placeholderTextColor={C.mutedDim}
          value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="none" autoCorrect={false} />
        {searchQuery.length > 0 && <Pressable onPress={() => setSearchQuery("")}><Text style={s.searchClear}>✕</Text></Pressable>}
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        {renderAssetList()}
        {filteredAssets.length === 0 && (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ fontFamily: "Inter", fontSize: 12, color: C.mutedDim }}>
              {searchQuery ? `No results for "${searchQuery}"` : "No assets in this category"}
            </Text>
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

  flipCardWrap: { width: "100%" } as any,
  card: { padding: 20, overflow: "hidden" },
  portfolioCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },

  portfolioLabel: { fontFamily: "Inter", fontSize: 9, color: C.mutedLight, letterSpacing: 1.2 },
  portfolioTotal: { fontFamily: "InterBold", fontSize: 34, color: C.white, marginTop: 2 },
  seekerBadge: { backgroundColor: "rgba(189,255,0,0.08)", borderWidth: 1, borderColor: "rgba(189,255,0,0.2)", paddingHorizontal: 8, paddingVertical: 3 },
  seekerBadgeText: { fontFamily: "InterBold", fontSize: 8, color: C.accent, letterSpacing: 0.5 },
  pnlValue: { fontFamily: "InterBold", fontSize: 14 },
  pnlPct: { fontFamily: "SpaceMono", fontSize: 11 },
  pnlLabel: { fontFamily: "Inter", fontSize: 9, color: C.mutedLight },
  flipHint: { fontFamily: "Inter", fontSize: 10, color: C.mutedDim },
  connectCardBtn: { borderWidth: 1, borderColor: C.accent, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  connectCardBtnText: { fontFamily: "InterBold", fontSize: 11, color: C.accent, letterSpacing: 1 },

  holdingMini: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 8 },
  holdingMiniSymbol: { fontFamily: "InterSemiBold", fontSize: 11, color: C.white, width: 44 },
  holdingMiniAmount: { fontFamily: "SpaceMono", fontSize: 10, color: C.muted, flex: 1 },
  holdingMiniUsd: { fontFamily: "SpaceMono", fontSize: 11, color: C.white },

  shadowCard: { backgroundColor: "#0a0a0f", borderWidth: 1, borderColor: C.purpleBorder, justifyContent: "space-between" },
  shadowCircle: { width: 26, height: 26, backgroundColor: "rgba(140,100,200,0.2)", borderWidth: 1, borderColor: "rgba(140,100,200,0.3)", alignItems: "center", justifyContent: "center" },
  shadowLabel: { fontFamily: "Inter", fontSize: 10, color: "rgba(140,100,200,0.5)", marginLeft: 10, letterSpacing: 0.8 },
  shadowTitle: { fontFamily: "InterBold", fontSize: 22, color: "rgba(180,140,240,0.7)", letterSpacing: -0.3, marginTop: 12 },
  shadowDesc: { fontFamily: "Inter", fontSize: 11, color: "rgba(140,100,200,0.4)", lineHeight: 16, marginTop: 6 },
  shadowCta: { fontFamily: "InterMedium", fontSize: 11, color: "rgba(180,140,240,0.6)", letterSpacing: 0.3 },
  comingSoonBadge: { backgroundColor: "rgba(140,100,200,0.08)", borderWidth: 1, borderColor: "rgba(140,100,200,0.2)", paddingHorizontal: 8, paddingVertical: 3 },
  comingSoonText: { fontFamily: "InterBold", fontSize: 7, color: "rgba(180,140,240,0.5)", letterSpacing: 0.8 },

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

  pulseCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 16 },
  pulseTitle: { fontFamily: "InterBold", fontSize: 10, color: C.accent, letterSpacing: 1.5, marginBottom: 14 },
  pulseSection: { paddingVertical: 4 },
  pulseSectionTitle: { fontFamily: "InterSemiBold", fontSize: 9, color: C.mutedLight, letterSpacing: 0.8 },
  pulseMiniLabel: { fontFamily: "Inter", fontSize: 8, color: C.mutedDim, letterSpacing: 0.5, marginBottom: 4 },

  sentimentRow: { flexDirection: "row", alignItems: "flex-start" },
  sentimentVal: { fontFamily: "InterBold", fontSize: 16, color: C.white, marginTop: 2 },
  sentimentSmall: { fontFamily: "Inter", fontSize: 10, color: C.muted },
  sentimentChg: { fontFamily: "SpaceMono", fontSize: 9, color: C.muted, marginTop: 2 },

  vDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.06)", marginHorizontal: 14, alignSelf: "stretch" },
  hDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 12 },

  fgBarRow: { flexDirection: "row", gap: 2, marginBottom: 4 },
  fgSeg: { flex: 1, height: 4 },

  toggleRow: { flexDirection: "row", gap: 4 },
  togglePill: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.border },
  toggleActive: { borderColor: C.accent, backgroundColor: "rgba(189,255,0,0.06)" },
  toggleText: { fontFamily: "InterSemiBold", fontSize: 8, color: C.mutedLight, letterSpacing: 0.3 },
  toggleTextActive: { color: C.accent },
  structureGrid: { flexDirection: "row", alignItems: "flex-start", marginTop: 10 },
  structureLabel: { fontFamily: "Inter", fontSize: 8, color: C.mutedDim, letterSpacing: 0.3 },
  structureNum: { fontFamily: "InterBold", fontSize: 18, color: C.white, marginTop: 2 },

  rwaValue: { fontFamily: "InterBold", fontSize: 22, color: C.accent },
  rwaContext: { fontFamily: "Inter", fontSize: 11, color: C.mutedLight },
  rwaSub: { fontFamily: "Inter", fontSize: 10, color: C.muted, marginTop: 4 },
  rwaCta: { fontFamily: "InterMedium", fontSize: 10, color: C.accent, marginTop: 8, letterSpacing: 0.2 },

  expandBody: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.04)" },
  expandText: { fontFamily: "Inter", fontSize: 11, color: C.muted, lineHeight: 17 },
  expandSource: { fontFamily: "Inter", fontSize: 8, color: C.mutedDim, marginTop: 10 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  breakdownLabel: { fontFamily: "Inter", fontSize: 10, color: C.mutedLight },
  breakdownVal: { fontFamily: "SpaceMono", fontSize: 10, color: C.white },

  tabRow: { flexDirection: "row", paddingHorizontal: 20, marginTop: 18, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: C.surface },
  tab: { paddingVertical: 10, paddingHorizontal: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: C.accent },
  tabText: { fontFamily: "InterSemiBold", fontSize: 10, color: C.mutedLight, letterSpacing: 1 },
  tabTextActive: { color: C.accent },

  searchWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginTop: 8, marginBottom: 4, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingHorizontal: 12, height: 40 },
  searchIcon: { fontSize: 16, color: C.mutedLight, marginRight: 8 },
  searchInput: { flex: 1, fontFamily: "Inter", fontSize: 13, color: C.white, height: 40 },
  searchClear: { fontSize: 14, color: C.muted, paddingLeft: 8 },

  sectionHeader: { paddingTop: 20, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.surface },
  sectionLabel: { fontFamily: "InterBold", fontSize: 13, color: C.white, letterSpacing: 0.3 },
  sectionSub: { fontFamily: "Inter", fontSize: 10, color: C.mutedLight, marginTop: 2 },

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
});
