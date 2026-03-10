/**
 * PRICE SERVICE — Jupiter primary, CoinGecko fills gaps + 24h changes + sparklines
 * DexScreener fallback for xStocks 24h changes
 */

import { SOLIS_ASSETS, JUPITER_API_KEY } from "./config";

let _changes24h: Record<string, number> = {};
let _sparklineCache: { symbol: string; data: number[]; ts: number } | null = null;

// ─── Jupiter ────────────────────────────────────────────────
async function tryJupiterWithKey(mints: string): Promise<any | null> {
  try {
    const res = await fetch(`https://api.jup.ag/price/v3/simple?ids=${mints}`, {
      method: "GET",
      headers: { "x-api-key": JUPITER_API_KEY, "Accept": "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function tryJupiterNoKey(mints: string): Promise<any | null> {
  try {
    const res = await fetch(`https://api.jup.ag/price/v3/simple?ids=${mints}`, {
      method: "GET", headers: { "Accept": "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function tryJupiterV2(mints: string): Promise<any | null> {
  try {
    const res = await fetch(`https://api.jup.ag/price/v2?ids=${mints}`, {
      method: "GET", headers: { "Accept": "application/json" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch { return null; }
}

function parseJupiterData(data: any, assets: typeof SOLIS_ASSETS): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const asset of assets) {
    const entry = data?.[asset.mint];
    if (!entry) continue;
    const price = entry.usdPrice || parseFloat(entry.price) || 0;
    if (price > 0) prices[asset.symbol] = price;
  }
  return prices;
}

// ─── CoinGecko ──────────────────────────────────────────────
const COINGECKO_IDS: Record<string, string> = {
  SOL: "solana",
  USDC: "usd-coin",
  USDT: "tether",
  cbBTC: "bitcoin",
  WBTC: "wrapped-bitcoin",
  zBTC: "bitcoin",
  tBTC: "bitcoin",
  xBTC: "bitcoin",
  LBTC: "bitcoin",
  PYUSD: "paypal-usd",
  SKR: "solana-mobile-token",
};

async function getCoinGeckoPrices(): Promise<Record<string, number>> {
  try {
    const ids = [...new Set(Object.values(COINGECKO_IDS))].join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );
    if (!res.ok) return {};
    const data = await res.json();

    const prices: Record<string, number> = {};
    const changes: Record<string, number> = {};
    for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
      const price = data?.[geckoId]?.usd;
      const change = data?.[geckoId]?.usd_24h_change;
      if (price) prices[symbol] = price;
      if (change != null) changes[symbol] = change;
    }
    for (const sym of ["USD1", "CASH", "hyUSD"]) {
      if (!prices[sym]) prices[sym] = 1.0;
      if (changes[sym] == null) changes[sym] = 0;
    }
    _changes24h = { ..._changes24h, ...changes };
    return prices;
  } catch { return {}; }
}

// ─── DexScreener 24h changes (for xStocks + tokens without CoinGecko) ───
async function getDexScreener24hChanges(): Promise<void> {
  const needsChange = SOLIS_ASSETS.filter(
    (a) => !COINGECKO_IDS[a.symbol] && !["USD1", "CASH", "hyUSD"].includes(a.symbol)
  );
  if (needsChange.length === 0) return;

  const mints = needsChange.map((a) => a.mint).join(",");
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mints}`);
    if (!res.ok) return;
    const data = await res.json();
    const pairs = data?.pairs?.filter((p: any) => p.chainId === "solana") || [];

    for (const asset of needsChange) {
      const tokenPairs = pairs.filter(
        (p: any) => p.baseToken?.address === asset.mint || p.quoteToken?.address === asset.mint
      );
      if (tokenPairs.length === 0) continue;
      const best = tokenPairs.sort(
        (a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      )[0];
      const change = best.priceChange?.h24;
      if (change != null) {
        _changes24h[asset.symbol] = change;
      }
    }
  } catch (err) {
    // DexScreener unavailable — changes stay empty for these tokens
  }
}

// ─── Main price fetch ───────────────────────────────────────
export async function getTokenPrices(): Promise<Record<string, number>> {
  const mints = SOLIS_ASSETS.map((a) => a.mint).join(",");
  const geckoPromise = getCoinGeckoPrices();
  const dexChangePromise = getDexScreener24hChanges();

  let jupiterPrices: Record<string, number> = {};

  const v3Key = await tryJupiterWithKey(mints);
  if (v3Key) {
    jupiterPrices = parseJupiterData(v3Key, SOLIS_ASSETS);
  }

  if (Object.keys(jupiterPrices).length <= 3) {
    const v3NoKey = await tryJupiterNoKey(mints);
    if (v3NoKey) jupiterPrices = parseJupiterData(v3NoKey, SOLIS_ASSETS);
  }

  if (Object.keys(jupiterPrices).length <= 3) {
    const v2 = await tryJupiterV2(mints);
    if (v2) jupiterPrices = parseJupiterData(v2, SOLIS_ASSETS);
  }

  const geckoPrices = await geckoPromise;
  await dexChangePromise;
  return { ...geckoPrices, ...jupiterPrices };
}

// ─── 24h changes ────────────────────────────────────────────
export function getToken24hChanges(): Record<string, number> {
  return { ..._changes24h };
}

// ─── Real 24h sparkline from CoinGecko ─────────────────────
export async function getSparkline24h(symbol: string): Promise<number[]> {
  // Cache for 5 minutes
  if (_sparklineCache && _sparklineCache.symbol === symbol && Date.now() - _sparklineCache.ts < 300000) {
    return _sparklineCache.data;
  }

  const geckoId = COINGECKO_IDS[symbol];
  if (!geckoId) return [];

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart?vs_currency=usd&days=1`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const prices: number[] = (data.prices || []).map((p: [number, number]) => p[1]);
    if (prices.length > 0) {
      _sparklineCache = { symbol, data: prices, ts: Date.now() };
    }
    return prices;
  } catch {
    return [];
  }
}

// ─── Single token price ────────────────────────────────────
export async function getTokenPrice(mint: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.jup.ag/price/v3/simple?ids=${mint}`);
    if (res.ok) {
      const data = await res.json();
      return data?.[mint]?.usdPrice || parseFloat(data?.[mint]?.price) || null;
    }
    return null;
  } catch { return null; }
}
