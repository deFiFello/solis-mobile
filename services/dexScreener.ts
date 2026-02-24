const DEXSCREENER_URL = "https://api.dexscreener.com/latest/dex/tokens";

export type DexMarketData = {
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  fdv: number | null;
  pairAddress?: string;
};

/**
 * Fetch market data for a token from DexScreener
 */
export async function getMarketData(mint: string): Promise<DexMarketData | null> {
  try {
    const res = await fetch(`${DEXSCREENER_URL}/${mint}`);
    if (!res.ok) return null;
    const data = await res.json();

    // Get the highest-liquidity Solana pair
    const pairs = data?.pairs?.filter((p: any) => p.chainId === "solana") || [];
    if (pairs.length === 0) return null;

    const best = pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

    return {
      price: parseFloat(best.priceUsd) || 0,
      priceChange24h: best.priceChange?.h24 || 0,
      volume24h: best.volume?.h24 || 0,
      liquidity: best.liquidity?.usd || 0,
      fdv: best.fdv || null,
      pairAddress: best.pairAddress,
    };
  } catch (err) {
    console.error("[DexScreener] Error:", err);
    return null;
  }
}

/**
 * Fetch market data for multiple tokens
 */
export async function getBatchMarketData(
  mints: string[]
): Promise<Record<string, DexMarketData>> {
  const results: Record<string, DexMarketData> = {};

  // DexScreener supports batch by comma-separated (up to ~30)
  const batchSize = 25;
  for (let i = 0; i < mints.length; i += batchSize) {
    const batch = mints.slice(i, i + batchSize);
    try {
      const res = await fetch(`${DEXSCREENER_URL}/${batch.join(",")}`);
      if (!res.ok) continue;
      const data = await res.json();
      const pairs = data?.pairs?.filter((p: any) => p.chainId === "solana") || [];

      for (const mint of batch) {
        const tokenPairs = pairs.filter(
          (p: any) =>
            p.baseToken?.address === mint || p.quoteToken?.address === mint
        );
        if (tokenPairs.length === 0) continue;

        const best = tokenPairs.sort(
          (a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
        )[0];

        const isBase = best.baseToken?.address === mint;
        results[mint] = {
          price: parseFloat(isBase ? best.priceUsd : (1 / parseFloat(best.priceUsd)).toString()) || 0,
          priceChange24h: best.priceChange?.h24 || 0,
          volume24h: best.volume?.h24 || 0,
          liquidity: best.liquidity?.usd || 0,
          fdv: best.fdv || null,
          pairAddress: best.pairAddress,
        };
      }
    } catch (err) {
      console.error("[DexScreener] Batch error:", err);
    }
  }

  return results;
}
