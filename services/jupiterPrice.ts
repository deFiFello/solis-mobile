import { SOLIS_ASSETS, COMMON_MINTS } from "./config";

const JUPITER_PRICE_URL = "https://api.jup.ag/price/v2";

export type TokenPrice = {
  mint: string;
  price: number;
};

/**
 * Fetch prices for all Solis tokens via Jupiter Price API v2
 */
export async function getTokenPrices(): Promise<Record<string, number>> {
  try {
    const mints = SOLIS_ASSETS.map((a) => a.mint).join(",");
    const res = await fetch(`${JUPITER_PRICE_URL}?ids=${mints}`);
    if (!res.ok) throw new Error(`Jupiter price API ${res.status}`);
    const data = await res.json();

    const prices: Record<string, number> = {};
    for (const asset of SOLIS_ASSETS) {
      const priceData = data?.data?.[asset.mint];
      if (priceData?.price) {
        prices[asset.symbol] = parseFloat(priceData.price);
      }
    }
    return prices;
  } catch (err) {
    console.error("[JupiterPrice] Error:", err);
    return {};
  }
}

/**
 * Fetch price for a single token
 */
export async function getTokenPrice(mint: string): Promise<number | null> {
  try {
    const res = await fetch(`${JUPITER_PRICE_URL}?ids=${mint}`);
    if (!res.ok) return null;
    const data = await res.json();
    return parseFloat(data?.data?.[mint]?.price) || null;
  } catch {
    return null;
  }
}
