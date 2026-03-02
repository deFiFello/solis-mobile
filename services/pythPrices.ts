// ═══════════════════════════════════════════════════════════
// PYTH NETWORK PRICE FEEDS
// ═══════════════════════════════════════════════════════════
// Optional — macro ticker primarily uses macroData.ts (Yahoo Finance)
// This provides a faster alternative for crypto prices

import { SOLIS_CONFIG } from "./config";

const PYTH_FEEDS: Record<string, string> = {
  BTC: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  ETH: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  SOL: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  SPX: "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
  NDX: "0xd7566a3ba7f7286ed54f4ae7e983f4420ae0b1e0f3892e11f9c4ab107b7571d0",
  GOLD: "0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2",
  OIL: "0xc7b72e5d860034288c0993c3aa2b2e0474b1c0ea1b6f36e83a6c79a29e29d06c",
};

export interface PythPrice {
  symbol: string;
  price: number;
  confidence: number;
}

export async function getPythPrices(
  symbols?: string[]
): Promise<Record<string, PythPrice>> {
  const feedSymbols = symbols || Object.keys(PYTH_FEEDS);
  const feedIds = feedSymbols.map((s) => PYTH_FEEDS[s]).filter(Boolean);
  if (feedIds.length === 0) return {};

  try {
    const params = feedIds.map((id) => `ids[]=${id}`).join("&");
    const res = await fetch(`${SOLIS_CONFIG.PYTH_PRICE_SERVICE}?${params}`);
    if (!res.ok) return {};

    const json = await res.json();
    const result: Record<string, PythPrice> = {};

    for (const entry of json.parsed || []) {
      const feedId = "0x" + entry.id;
      const symbol = feedSymbols.find((s) => PYTH_FEEDS[s] === feedId);
      if (!symbol || !entry.price) continue;

      result[symbol] = {
        symbol,
        price: parseFloat(entry.price.price) * Math.pow(10, entry.price.expo),
        confidence:
          parseFloat(entry.price.conf) * Math.pow(10, entry.price.expo),
      };
    }

    return result;
  } catch (err) {
    console.warn("[Pyth] Failed:", err);
    return {};
  }
}
