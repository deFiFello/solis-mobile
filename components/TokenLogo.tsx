// ═══════════════════════════════════════════════════════════
// TOKEN LOGO — Local bundled PNGs → Remote URL → Branded circle
// ═══════════════════════════════════════════════════════════
// React Native require() must be static — no dynamic paths.
// BTC wrappers + USD1: local bundled (fast, consistent, never fail)
// SOL, stables, SKR: remote CDN URLs (reliable PNGs)
// xStocks: branded circle with ticker initial (no public logo images)
// CASH, hyUSD: branded circles (no public image exists)

import React, { useState } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  ImageSourcePropType,
} from "react-native";

// ─── Local bundled assets (require must be static) ─────────
const LOCAL_LOGOS: Record<string, ImageSourcePropType> = {
  cbBTC: require("../assets/tokens/cbBTC.png"),
  WBTC: require("../assets/tokens/WBTC.png"),
  zBTC: require("../assets/tokens/zBTC.jpg"),
  tBTC: require("../assets/tokens/tBTC.png"),
  xBTC: require("../assets/tokens/xBTC.png"),
  LBTC: require("../assets/tokens/LBTC.jpg"),
  USD1: require("../assets/tokens/USD1.jpg"),
};

// ─── Remote URLs for tokens without local assets ───────────
const REMOTE_LOGOS: Record<string, string> = {
  SOL: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  USDC: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  USDT: "https://assets.coingecko.com/coins/images/325/standard/Tether.png",
  PYUSD: "https://assets.coingecko.com/coins/images/31212/standard/PYUSD_Logo_%282%29.png",
  SKR: "https://arweave.net/C3tMsTe2FX0AYKQ_JxHfGGG3bmQJ9hUGlVDwK6bOo4c",
};

// ─── Branded fallback circles ──────────────────────────────
// Crypto + stablecoins
const BRAND_COLORS: Record<string, { bg: string; fg: string }> = {
  // BTC wrappers
  cbBTC: { bg: "#0052FF", fg: "#FFF" },
  WBTC: { bg: "#F09242", fg: "#FFF" },
  zBTC: { bg: "#7B61FF", fg: "#FFF" },
  tBTC: { bg: "#7C3AED", fg: "#FFF" },
  xBTC: { bg: "#FFFFFF", fg: "#000" },
  LBTC: { bg: "#0EA5E9", fg: "#FFF" },
  // Base
  SOL: { bg: "#9945FF", fg: "#FFF" },
  // Stablecoins
  USDC: { bg: "#2775CA", fg: "#FFF" },
  USDT: { bg: "#26A17B", fg: "#FFF" },
  PYUSD: { bg: "#0070E0", fg: "#FFF" },
  USD1: { bg: "#C9A834", fg: "#FFF" },
  CASH: { bg: "#8B5CF6", fg: "#FFF" },
  hyUSD: { bg: "#10B981", fg: "#FFF" },
  SKR: { bg: "#BDFF00", fg: "#000" },
  // xStocks — company brand colors
  TSLAx: { bg: "#E31937", fg: "#FFF" },  // Tesla red
  AAPLx: { bg: "#A2AAAD", fg: "#000" },  // Apple silver
  NVDAx: { bg: "#76B900", fg: "#000" },  // NVIDIA green
  GOOGLx: { bg: "#4285F4", fg: "#FFF" }, // Google blue
  METAx: { bg: "#0668E1", fg: "#FFF" },  // Meta blue
  AMZNx: { bg: "#FF9900", fg: "#000" },  // Amazon orange
  MSTRx: { bg: "#D51F2A", fg: "#FFF" },  // MicroStrategy red
  COINx: { bg: "#0052FF", fg: "#FFF" },  // Coinbase blue
  SPYx: { bg: "#003087", fg: "#FFF" },   // S&P navy
};

// ─── Stock ticker → clean display name ─────────────────────
const STOCK_INITIALS: Record<string, string> = {
  TSLAx: "TSLA",
  AAPLx: "AAPL",
  NVDAx: "NVDA",
  GOOGLx: "GOOG",
  METAx: "META",
  AMZNx: "AMZN",
  MSTRx: "MSTR",
  COINx: "COIN",
  SPYx: "SPY",
};

type Props = {
  symbol: string;
  size?: number;
};

export default function TokenLogo({ symbol, size = 38 }: Props) {
  const [remoteFailed, setRemoteFailed] = useState(false);

  const borderRadius = size / 2;

  // 1. Local bundled asset (instant, never fails)
  if (LOCAL_LOGOS[symbol]) {
    return (
      <Image
        source={LOCAL_LOGOS[symbol]}
        style={[styles.image, { width: size, height: size, borderRadius }]}
      />
    );
  }

  // 2. Remote URL
  const remoteUrl = REMOTE_LOGOS[symbol];
  if (remoteUrl && !remoteFailed) {
    return (
      <Image
        source={{ uri: remoteUrl }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
        onError={() => setRemoteFailed(true)}
      />
    );
  }

  // 3. Branded circle fallback (crypto, stables, xStocks)
  const colors = BRAND_COLORS[symbol] || { bg: "#333", fg: "#FFF" };
  // xStocks show clean ticker (TSLAx → TSLA), others show 2-3 char symbol
  const initials =
    STOCK_INITIALS[symbol] ||
    (symbol.length <= 3 ? symbol : symbol.slice(0, 2));
  // Smaller font for 4-char stock tickers
  const fontSize = initials.length >= 4 ? size * 0.24 : size * 0.32;

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: colors.bg,
        },
      ]}
    >
      <Text
        style={[styles.initials, { color: colors.fg, fontSize }]}
        numberOfLines={1}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: "#111" },
  circle: { alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: "InterBold", letterSpacing: 0.5 },
});
