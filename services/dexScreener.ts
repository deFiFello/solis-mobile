// ═══════════════════════════════════════════════════════════
// DEXSCREENER MARKET DATA SERVICE
// ═══════════════════════════════════════════════════════════
// Consumer: asset detail pages (future)

import { SOLIS_CONFIG } from "./config";

export interface MarketData {
  price: string;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  totalLiquidity: number;
  totalVolume: number;
  allPairs: MarketPair[];
  supply: number | null;
}

export interface MarketPair {
  dex: string;
  baseToken: string;
  quoteToken: string;
  liquidity: number;
  volume24h: number;
  url: string;
}

export async function getMarketData(
  mint: string
): Promise<MarketData | null> {
  try {
    const res = await fetch(
      `${SOLIS_CONFIG.DEXSCREENER_API_URL}/tokens/${mint}`
    );
    if (!res.ok) return null;

    const json = await res.json();
    const pairs = json.pairs || [];
    if (pairs.length === 0) return null;

    const sorted = [...pairs].sort(
      (a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    );
    const primary = sorted[0];

    const allPairs: MarketPair[] = sorted.map((p: any) => ({
      dex: p.dexId || "unknown",
      baseToken: p.baseToken?.symbol || "?",
      quoteToken: p.quoteToken?.symbol || "?",
      liquidity: p.liquidity?.usd || 0,
      volume24h: p.volume?.h24 || 0,
      url: p.url || "",
    }));

    const totalLiquidity = sorted.reduce(
      (sum: number, p: any) => sum + (p.liquidity?.usd || 0),
      0
    );
    const totalVolume = sorted.reduce(
      (sum: number, p: any) => sum + (p.volume?.h24 || 0),
      0
    );

    return {
      price: primary.priceUsd || "0",
      priceChange24h: primary.priceChange?.h24 || 0,
      volume24h: primary.volume?.h24 || 0,
      liquidity: primary.liquidity?.usd || 0,
      totalLiquidity,
      totalVolume,
      allPairs,
      supply:
        primary.fdv && primary.priceUsd
          ? primary.fdv / parseFloat(primary.priceUsd)
          : null,
    };
  } catch (err) {
    console.warn("[DexScreener] Failed for", mint, err);
    return null;
  }
}
