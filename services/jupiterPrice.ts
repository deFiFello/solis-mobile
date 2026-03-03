// ═══════════════════════════════════════════════════════════
// PRICE SERVICE — MOBILE
// ═══════════════════════════════════════════════════════════
// Jupiter V2 returns 0 prices from React Native (origin-restricted).
// Strategy: CoinGecko → DexScreener → hardcoded stables
//
// Consumer: index.tsx
//   import { getTokenPrices } from "../../services/jupiterPrice";
//   const prices = await getTokenPrices();
//   // → { SOL: 140.5, cbBTC: 97000, USDC: 1.0, ... }

import { SOLIS_CONFIG, SOLIS_ASSETS } from "./config";

let priceCache: Record<string, number> = {};
let lastFetch = 0;
const CACHE_TTL = 15_000; // 15s

// CoinGecko IDs — reliable from any client
const COINGECKO_IDS: Record<string, string> = {
  cbBTC: "bitcoin",
  WBTC: "wrapped-bitcoin",
  zBTC: "bitcoin",
  tBTC: "bitcoin",
  xBTC: "bitcoin",
  LBTC: "bitcoin",
  SOL: "solana",
  SKR: "seeker",
};

const STABLE_SYMBOLS = ["USDC", "USDT", "PYUSD", "USD1", "CASH", "hyUSD"];

export async function getTokenPrices(): Promise<Record<string, number>> {
  const now = Date.now();
  if (now - lastFetch < CACHE_TTL && Object.keys(priceCache).length > 0) {
    return { ...priceCache };
  }

  const result: Record<string, number> = {};

  // ── 1. CoinGecko batch (BTC wrappers + SOL + SKR) ────────
  try {
    const ids = [...new Set(Object.values(COINGECKO_IDS))].join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
    );
    if (res.ok) {
      const json = await res.json();
      for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
        const p = json[geckoId]?.usd;
        if (p) result[symbol] = p;
      }
      console.log(
        `[Prices] CoinGecko OK — ${Object.keys(result).length} (SOL=$${result.SOL ?? "?"})`
      );
    } else {
      console.warn("[Prices] CoinGecko HTTP", res.status);
    }
  } catch (e) {
    console.warn("[Prices] CoinGecko err:", e);
  }

  // ── 2. Stablecoins → $1.00 ───────────────────────────────
  for (const s of STABLE_SYMBOLS) result[s] = 1.0;

  // ── 3. DexScreener for anything still missing ─────────────
  const missing = SOLIS_ASSETS.filter((a) => !(a.symbol in result));
  if (missing.length > 0) {
    const fetches = missing.map(async (asset) => {
      try {
        const r = await fetch(
          `${SOLIS_CONFIG.DEXSCREENER_API}/tokens/${asset.mint}`
        );
        if (!r.ok) return;
        const j = await r.json();
        const pair = j.pairs?.[0];
        if (!pair?.priceUsd) return;
        const price = parseFloat(pair.priceUsd);
        // Sanity: SOL > $1, stables ~$1, BTC > $1000
        if (asset.category === "stable" && (price < 0.5 || price > 2)) return;
        if (asset.symbol === "SOL" && price < 1) return;
        if (asset.category === "btc" && price < 1000) return;
        result[asset.symbol] = price;
      } catch {}
    });
    await Promise.all(fetches);
  }

  console.log(
    `[Prices] Final: ${Object.keys(result).length}/${SOLIS_ASSETS.length}`
  );

  if (Object.keys(result).length > 0) {
    priceCache = result;
    lastFetch = now;
  }

  return { ...result };
}
