// ═══════════════════════════════════════════════════════════
// ASSET DETAIL PAGE — 2-tab mobile layout (Markets + Info)
// Route: app/asset/[symbol].tsx
// ═══════════════════════════════════════════════════════════
// Markets tab: Live price, 24h change, volume, market cap, pools
// Info tab: Description, issuer, custody, peg, risks, links
// No external icon library — uses Unicode characters

import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import TokenLogo from "../../components/TokenLogo";
import { getAssetBySymbol, SOLIS_CONFIG } from "../../services/config";
import { getAssetMetadata } from "../../services/assetMetadata";

// ─── Brand V2 Colors ──────────────────────────────────────
const C = {
  bg: "#000000",
  surface: "#1A1A1A",
  border: "#2D2D2D",
  green: "#BDFF00",
  red: "#FF4444",
  white: "#FFFFFF",
  muted: "rgba(255,255,255,0.4)",
  dimmed: "rgba(255,255,255,0.25)",
  subtle: "rgba(255,255,255,0.15)",
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

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════
export default function AssetDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const router = useRouter();

  const [tab, setTab] = useState<"markets" | "info">("markets");
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const asset = symbol ? getAssetBySymbol(symbol) : null;
  const meta = symbol ? getAssetMetadata(symbol) : null;

  // ─── Fetch market data from DexScreener ──────────────────
  const fetchMarketData = useCallback(async () => {
    if (!asset) return;
    try {
      const res = await fetch(
        `${SOLIS_CONFIG.DEXSCREENER_API_URL}/tokens/${asset.mint}`
      );
      const json = await res.json();
      const pairs: DexPair[] = json.pairs || [];

      if (pairs.length === 0) {
        setMarketData({
          price: asset.category === "stable" ? 1.0 : 0,
          change24h: 0,
          volume24h: 0,
          marketCap: 0,
          pairs: [],
        });
        return;
      }

      // Use highest-liquidity pair for headline stats
      const primary = pairs.sort(
        (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      )[0];

      setMarketData({
        price: parseFloat(primary.priceUsd) || 0,
        change24h: primary.priceChange?.h24 || 0,
        volume24h: pairs.reduce((sum, p) => sum + (p.volume?.h24 || 0), 0),
        marketCap: primary.fdv || 0,
        pairs: pairs.slice(0, 8),
      });
    } catch (err) {
      console.warn("[AssetDetail] DexScreener fetch failed:", err);
      setMarketData({ price: 0, change24h: 0, volume24h: 0, marketCap: 0, pairs: [] });
    }
  }, [asset]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchMarketData();
      setLoading(false);
    })();
  }, [fetchMarketData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMarketData();
    setRefreshing(false);
  }, [fetchMarketData]);

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
    asset.category === "btc" ? "BTC WRAPPER"
    : asset.category === "stable" ? "STABLECOIN"
    : asset.category === "stock" ? "TOKENIZED STOCK"
    : "CRYPTO";

  const isPositive = (marketData?.change24h || 0) >= 0;

  return (
    <View style={styles.container}>
      {/* ─── Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.headerBack}
        >
          <Text style={{ color: C.white, fontSize: 22 }}>‹</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <TokenLogo symbol={asset.symbol} size={32} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerSymbol}>{asset.symbol}</Text>
            <Text style={styles.headerName} numberOfLines={1}>{asset.name}</Text>
          </View>
        </View>

        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{categoryLabel}</Text>
        </View>
      </View>

      {/* ─── Price Banner ─────────────────────────────────── */}
      {loading ? (
        <View style={styles.priceBanner}>
          <ActivityIndicator color={C.green} size="small" />
        </View>
      ) : (
        <View style={styles.priceBanner}>
          <Text style={styles.priceValue}>{fmtPrice(marketData?.price || 0)}</Text>
          <View
            style={[
              styles.changePill,
              { backgroundColor: isPositive ? "rgba(189,255,0,0.12)" : "rgba(255,68,68,0.12)" },
            ]}
          >
            <Text style={[styles.changeText, { color: isPositive ? C.green : C.red }]}>
              {isPositive ? "▲" : "▼"} {Math.abs(marketData?.change24h || 0).toFixed(2)}%
            </Text>
          </View>
        </View>
      )}

      {/* ─── Tab Bar ──────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {(["markets", "info"] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
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
          <MarketsTab data={marketData} loading={loading} asset={asset} />
        ) : (
          <InfoTab meta={meta} asset={asset} />
        )}
      </ScrollView>

      {/* ─── Swap CTA ─────────────────────────────────────── */}
      <View style={styles.ctaContainer}>
        <Pressable
          style={styles.ctaButton}
          onPress={() => router.push("/(tabs)/swap")}
          android_ripple={{ color: "rgba(0,0,0,0.2)" }}
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
  data, loading, asset,
}: {
  data: MarketData | null;
  loading: boolean;
  asset: { symbol: string; mint: string; category: string };
}) {
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={C.green} />
      </View>
    );
  }

  return (
    <View>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Volume (24h)</Text>
          <Text style={styles.statValue}>{fmt(data?.volume24h || 0)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Market Cap</Text>
          <Text style={styles.statValue}>{fmt(data?.marketCap || 0)}</Text>
        </View>
      </View>

      {/* Liquidity Pools */}
      <Text style={styles.sectionTitle}>LIQUIDITY POOLS</Text>

      {data?.pairs && data.pairs.length > 0 ? (
        data.pairs.map((pair, i) => (
          <Pressable
            key={pair.pairAddress || i}
            style={styles.poolRow}
            onPress={() => pair.url && Linking.openURL(pair.url)}
            android_ripple={{ color: "rgba(189,255,0,0.06)" }}
          >
            <View style={styles.poolLeft}>
              <Text style={styles.poolDex}>{pair.dexId?.toUpperCase() || "DEX"}</Text>
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
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={{ color: C.dimmed, fontSize: 18, marginBottom: 4 }}>~</Text>
          <Text style={styles.emptyText}>No pools found on DexScreener for {asset.symbol}</Text>
          {asset.category === "stable" && (
            <Text style={styles.emptySubtext}>
              Stablecoins trade across many pool pairs — try swapping directly
            </Text>
          )}
        </View>
      )}

      {/* Solscan Link */}
      <Pressable
        style={styles.solscanLink}
        onPress={() => Linking.openURL(`https://solscan.io/token/${asset.mint}`)}
        android_ripple={{ color: "rgba(189,255,0,0.06)" }}
      >
        <Text style={{ color: C.green, fontSize: 14 }}>◎</Text>
        <Text style={styles.solscanText}>View on Solscan</Text>
        <Text style={{ color: C.muted, fontSize: 12 }}>↗</Text>
      </Pressable>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// INFO TAB
// ═══════════════════════════════════════════════════════════
function InfoTab({
  meta, asset,
}: {
  meta: ReturnType<typeof getAssetMetadata>;
  asset: { symbol: string; name: string; category: string };
}) {
  if (!meta) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No metadata available for {asset.symbol}</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Description */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>ABOUT</Text>
        <Text style={styles.infoDescription}>{meta.description}</Text>
      </View>

      {/* Key Details */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>KEY DETAILS</Text>
        <InfoRow label="Issuer" value={meta.issuer} />
        <InfoRow label="Custody" value={meta.custody} />
        <InfoRow label="Peg Mechanism" value={meta.peg} />
      </View>

      {/* Tags */}
      {meta.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {meta.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Risks */}
      {meta.risks.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>RISK FACTORS</Text>
          {meta.risks.map((risk, i) => (
            <View key={i} style={styles.riskRow}>
              <Text style={{ color: C.red, fontSize: 12, marginRight: 8, marginTop: 1 }}>⚠</Text>
              <Text style={styles.riskText}>{risk}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Links */}
      {meta.links.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>RESOURCES</Text>
          {meta.links.map((link, i) => (
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
      )}

      {/* xStock Disclaimer */}
      {asset.category === "stock" && (
        <View style={[styles.infoCard, { borderColor: "rgba(255,68,68,0.3)" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ color: C.red, fontSize: 14, marginRight: 6 }}>⚠</Text>
            <Text style={[styles.infoLabel, { marginBottom: 0 }]}>REGULATORY NOTICE</Text>
          </View>
          <Text style={styles.disclaimerText}>
            Tokenized stocks provide price exposure only. Holders do not receive shareholder
            voting rights. Dividends are automatically reinvested into the token balance.
            xStocks are not available to US persons. Always verify regulatory status in your jurisdiction.
          </Text>
        </View>
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

  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerBack: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", marginLeft: 4 },
  headerSymbol: { color: C.white, fontFamily: "InterBold", fontSize: 17, letterSpacing: 0.5 },
  headerName: { color: C.muted, fontFamily: "Inter", fontSize: 12, marginTop: 1, maxWidth: SCREEN_WIDTH * 0.45 },
  headerBadge: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingHorizontal: 8, paddingVertical: 3 },
  headerBadgeText: { color: C.muted, fontFamily: "InterSemiBold", fontSize: 9, letterSpacing: 1 },

  priceBanner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  priceValue: { color: C.white, fontFamily: "InterBold", fontSize: 28, fontVariant: ["tabular-nums"] },
  changePill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4 },
  changeText: { fontFamily: "InterSemiBold", fontSize: 13, fontVariant: ["tabular-nums"] },

  tabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, marginHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: C.green },
  tabText: { color: C.muted, fontFamily: "InterSemiBold", fontSize: 13, letterSpacing: 1.5 },
  tabTextActive: { color: C.green },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },

  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 14 },
  statLabel: { color: C.muted, fontFamily: "Inter", fontSize: 11, letterSpacing: 0.5, marginBottom: 6 },
  statValue: { color: C.white, fontFamily: "InterBold", fontSize: 18, fontVariant: ["tabular-nums"] },

  sectionTitle: { color: C.muted, fontFamily: "InterSemiBold", fontSize: 11, letterSpacing: 1.5, marginBottom: 10 },
  poolRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 6,
  },
  poolLeft: { flex: 1 },
  poolDex: { color: C.green, fontFamily: "InterSemiBold", fontSize: 11, letterSpacing: 0.5, marginBottom: 2 },
  poolPair: { color: C.white, fontFamily: "Inter", fontSize: 13 },
  poolRight: { alignItems: "flex-end" },
  poolLiquidity: { color: C.white, fontFamily: "Inter", fontSize: 12, fontVariant: ["tabular-nums"], marginBottom: 2 },
  poolVolume: { color: C.muted, fontFamily: "Inter", fontSize: 11, fontVariant: ["tabular-nums"] },

  emptyCard: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    padding: 24, alignItems: "center", gap: 4,
  },
  emptyText: { color: C.muted, fontFamily: "Inter", fontSize: 13, textAlign: "center" },
  emptySubtext: { color: C.dimmed, fontFamily: "Inter", fontSize: 11, textAlign: "center" },

  solscanLink: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 16, paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  solscanText: { color: C.green, fontFamily: "InterSemiBold", fontSize: 13, flex: 1 },

  infoCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  infoLabel: { color: C.muted, fontFamily: "InterSemiBold", fontSize: 10, letterSpacing: 1.5, marginBottom: 10 },
  infoDescription: { color: "rgba(255,255,255,0.85)", fontFamily: "Inter", fontSize: 14, lineHeight: 21 },
  infoRow: { borderTopWidth: 1, borderTopColor: C.border, paddingVertical: 10 },
  infoRowLabel: { color: C.muted, fontFamily: "Inter", fontSize: 11, marginBottom: 4 },
  infoRowValue: { color: C.white, fontFamily: "Inter", fontSize: 13, lineHeight: 19 },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  tag: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { color: C.muted, fontFamily: "Inter", fontSize: 11, letterSpacing: 0.5 },

  riskRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 6, borderTopWidth: 1, borderTopColor: C.border },
  riskText: { color: "rgba(255,255,255,0.7)", fontFamily: "Inter", fontSize: 13, flex: 1, lineHeight: 19 },

  linkRow: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border,
  },
  linkText: { color: C.green, fontFamily: "Inter", fontSize: 13, flex: 1 },

  disclaimerText: { color: "rgba(255,255,255,0.6)", fontFamily: "Inter", fontSize: 12, lineHeight: 18 },

  ctaContainer: {
    paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8,
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border,
  },
  ctaButton: { backgroundColor: C.green, paddingVertical: 16, alignItems: "center" },
  ctaText: { color: "#000", fontFamily: "InterBold", fontSize: 16, letterSpacing: 0.5 },

  errorText: { color: C.muted, fontFamily: "Inter", fontSize: 15, marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  backBtnText: { color: C.green, fontFamily: "InterSemiBold", fontSize: 14 },
});
