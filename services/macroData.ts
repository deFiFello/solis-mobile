// Macro market data for the scrolling ticker
// Uses free Yahoo Finance API for traditional markets + Jupiter for crypto

export type MacroDataPoint = {
  label: string;
  value: string;
  change: string;
  up: boolean;
};

// Yahoo Finance chart API (free, no key)
async function fetchYahooQuote(symbol: string): Promise<{ price: number; change: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice || 0;
    const prevClose = meta.chartPreviousClose || meta.previousClose || price;
    const changePct = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

    return { price, change: changePct };
  } catch {
    return null;
  }
}

/**
 * Fetch all macro indicators for the ticker
 */
export async function getMacroData(): Promise<MacroDataPoint[]> {
  const symbols = [
    { label: "S&P", yahoo: "^GSPC", format: "currency" },
    { label: "NDQ", yahoo: "^IXIC", format: "currency" },
    { label: "GOLD", yahoo: "GC=F", format: "currency" },
    { label: "DOW", yahoo: "^DJI", format: "currency" },
    { label: "OIL", yahoo: "CL=F", format: "currency" },
    { label: "10Y", yahoo: "^TNX", format: "percent" },
  ];

  const results: MacroDataPoint[] = [];

  // Fetch all in parallel
  const promises = symbols.map((s) => fetchYahooQuote(s.yahoo));
  const responses = await Promise.all(promises);

  for (let i = 0; i < symbols.length; i++) {
    const s = symbols[i];
    const data = responses[i];

    if (data) {
      const valueStr =
        s.format === "percent"
          ? `${data.price.toFixed(2)}%`
          : `$${data.price >= 1000 ? data.price.toLocaleString("en-US", { maximumFractionDigits: 0 }) : data.price.toFixed(2)}`;

      results.push({
        label: s.label,
        value: valueStr,
        change: `${data.change >= 0 ? "+" : ""}${data.change.toFixed(2)}%`,
        up: data.change >= 0,
      });
    } else {
      results.push({
        label: s.label,
        value: "--",
        change: "--",
        up: true,
      });
    }
  }

  return results;
}

// Fear & Greed Index (alternative.me free API)
export async function getFearGreedIndex(): Promise<{ value: number; label: string } | null> {
  try {
    const res = await fetch("https://api.alternative.me/fng/");
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data?.data?.[0];
    return entry
      ? { value: parseInt(entry.value), label: entry.value_classification }
      : null;
  } catch {
    return null;
  }
}

// BTC Dominance from CoinGecko
export async function getBtcDominance(): Promise<number | null> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global");
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.market_cap_percentage?.btc || null;
  } catch {
    return null;
  }
}

// Stablecoin market cap percentage
export async function getStablecoinDominance(): Promise<number | null> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global");
    if (!res.ok) return null;
    const data = await res.json();
    const stables = ["usdt", "usdc", "dai", "busd"];
    let total = 0;
    const mcPct = data?.data?.market_cap_percentage || {};
    for (const s of stables) {
      total += mcPct[s] || 0;
    }
    return total > 0 ? total : null;
  } catch {
    return null;
  }
}
