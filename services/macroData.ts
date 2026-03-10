// Macro market data for scrolling ticker + metric cards
// Yahoo Finance for traditional markets, CoinGecko + DefiLlama for crypto

export type MacroDataPoint = {
  label: string;
  value: string;
  change: string;
  up: boolean;
};

export type CryptoMetrics = {
  fearGreed: { value: number; label: string } | null;
  btcDominance: number | null;
  totalMarketCap: number | null;         // trillions
  totalMarketCapChange24h: number | null; // percentage
  stablecoinMarketCap: number | null;    // billions
  stablecoinDominance: number | null;    // percentage of total
};

export type RwaData = {
  solanaRwa: number | null;   // USD value on Solana
  totalRwa: number | null;    // USD value all chains
  protocolCount: number;      // number of RWA protocols on Solana
  growthPct: number | null;   // best available growth %
  growthPeriod: string | null; // "7d" | "30d" | "1d" — whichever is available
};

// ─── Yahoo Finance ──────────────────────────────────────────
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
  } catch { return null; }
}

export async function getMacroData(): Promise<MacroDataPoint[]> {
  const symbols = [
    { label: "S&P", yahoo: "^GSPC", format: "currency" },
    { label: "NDQ", yahoo: "^IXIC", format: "currency" },
    { label: "GOLD", yahoo: "GC=F", format: "currency" },
    { label: "DOW", yahoo: "^DJI", format: "currency" },
    { label: "OIL", yahoo: "CL=F", format: "currency" },
    { label: "10Y", yahoo: "^TNX", format: "percent" },
    { label: "DXY", yahoo: "DX-Y.NYB", format: "decimal" },
  ];

  const results: MacroDataPoint[] = [];
  const responses = await Promise.all(symbols.map((s) => fetchYahooQuote(s.yahoo)));

  for (let i = 0; i < symbols.length; i++) {
    const s = symbols[i];
    const data = responses[i];
    if (data) {
      const valueStr =
        s.format === "percent" ? `${data.price.toFixed(2)}%`
        : s.format === "decimal" ? data.price.toFixed(2)
        : `$${data.price >= 1000 ? data.price.toLocaleString("en-US", { maximumFractionDigits: 0 }) : data.price.toFixed(2)}`;
      results.push({
        label: s.label, value: valueStr,
        change: `${data.change >= 0 ? "+" : ""}${data.change.toFixed(2)}%`,
        up: data.change >= 0,
      });
    } else {
      results.push({ label: s.label, value: "--", change: "--", up: true });
    }
  }
  return results;
}

// ─── CoinGecko Global — single call for all crypto metrics ──
export async function getCryptoMetrics(): Promise<CryptoMetrics> {
  const [fg, global] = await Promise.all([fetchFearGreed(), fetchCoinGeckoGlobal()]);
  return {
    fearGreed: fg,
    btcDominance: global?.btcDominance ?? null,
    totalMarketCap: global?.totalMarketCap ?? null,
    totalMarketCapChange24h: global?.totalMarketCapChange24h ?? null,
    stablecoinMarketCap: global?.stablecoinMarketCap ?? null,
    stablecoinDominance: global?.stablecoinDominance ?? null,
  };
}

async function fetchFearGreed(): Promise<{ value: number; label: string } | null> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=2");
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data?.data?.[0];
    return entry ? { value: parseInt(entry.value), label: entry.value_classification } : null;
  } catch { return null; }
}

async function fetchCoinGeckoGlobal(): Promise<{
  btcDominance: number;
  totalMarketCap: number;
  totalMarketCapChange24h: number;
  stablecoinMarketCap: number;
  stablecoinDominance: number;
} | null> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global");
    if (!res.ok) return null;
    const g = (await res.json())?.data;
    if (!g) return null;

    // Sum stablecoin dominance from known stablecoins
    const stableIds = ["usdt", "usdc", "dai", "busd", "tusd", "frax"];
    let stableDom = 0;
    const mcPct = g.market_cap_percentage || {};
    for (const id of stableIds) stableDom += mcPct[id] || 0;

    const totalMcapUsd = g.total_market_cap?.usd || 0;
    const stableMcap = totalMcapUsd * (stableDom / 100);

    return {
      btcDominance: mcPct.btc || 0,
      totalMarketCap: totalMcapUsd / 1e12,
      totalMarketCapChange24h: g.market_cap_change_percentage_24h_usd || 0,
      stablecoinMarketCap: stableMcap / 1e9, // billions
      stablecoinDominance: stableDom,
    };
  } catch { return null; }
}

// ─── DefiLlama RWA on Solana ────────────────────────────────
// GET https://api.llama.fi/protocols (free, no key)
// Filter category=RWA, sum chainTvls.Solana
// Large response (~5MB) — cache 10 minutes

let rwaCache: { data: RwaData; ts: number } | null = null;
const RWA_CACHE_MS = 10 * 60 * 1000;

export async function getRwaOnSolana(): Promise<RwaData> {
  if (rwaCache && Date.now() - rwaCache.ts < RWA_CACHE_MS) {
    return rwaCache.data;
  }

  const empty: RwaData = { solanaRwa: null, totalRwa: null, protocolCount: 0, growthPct: null, growthPeriod: null };

  try {
    const res = await fetch("https://api.llama.fi/protocols");
    if (!res.ok) return empty;
    const protocols: any[] = await res.json();

    const rwa = protocols.filter((p: any) => p.category === "RWA");
    let solTvl = 0;
    let solCount = 0;
    const totalTvl = rwa.reduce((sum: number, p: any) => sum + (p.tvl || 0), 0);

    // Try change fields in preference order: 30d > 7d > 1d
    const CHANGE_FIELDS = [
      { key: "change_1m", label: "30d" },
      { key: "change_7d", label: "7d" },
      { key: "change_1d", label: "24h" },
    ];

    // Weighted growth accumulators per field
    const accum: Record<string, { sum: number; denom: number }> = {};
    for (const f of CHANGE_FIELDS) accum[f.key] = { sum: 0, denom: 0 };

    let logged = false;
    for (const p of rwa) {
      const sol = p.chainTvls?.Solana || 0;
      if (sol > 0) {
        solTvl += sol;
        solCount++;

        // Log first protocol's available fields for debugging
        if (!logged) {
          const changeKeys = Object.keys(p).filter(k => k.startsWith("change"));
          console.log(`[RWA] First Solana RWA protocol "${p.name}" change fields:`, changeKeys);
          logged = true;
        }

        for (const f of CHANGE_FIELDS) {
          const val = p[f.key];
          if (val != null && typeof val === "number" && !isNaN(val)) {
            accum[f.key].sum += val * sol;
            accum[f.key].denom += sol;
          }
        }
      }
    }

    // Pick best available growth metric
    let growthPct: number | null = null;
    let growthPeriod: string | null = null;
    for (const f of CHANGE_FIELDS) {
      if (accum[f.key].denom > 0) {
        growthPct = accum[f.key].sum / accum[f.key].denom;
        growthPeriod = f.label;
        break;
      }
    }

    if (growthPct != null) {
      console.log(`[RWA] Solana RWA growth: ${growthPct.toFixed(1)}% (${growthPeriod})`);
    } else {
      console.log("[RWA] No growth data available from DefiLlama");
    }

    const data: RwaData = {
      solanaRwa: solTvl,
      totalRwa: totalTvl,
      protocolCount: solCount,
      growthPct,
      growthPeriod,
    };
    rwaCache = { data, ts: Date.now() };
    return data;
  } catch (err) {
    console.error("[RWA] Fetch error:", err);
    return empty;
  }
}

// ─── Legacy exports ─────────────────────────────────────────
export async function getFearGreedIndex() { return fetchFearGreed(); }
export async function getBtcDominance(): Promise<number | null> {
  const g = await fetchCoinGeckoGlobal();
  return g?.btcDominance ?? null;
}
export async function getTotalMarketCap(): Promise<number | null> {
  const g = await fetchCoinGeckoGlobal();
  return g?.totalMarketCap ?? null;
}
export async function getStablecoinDominance(): Promise<number | null> {
  const g = await fetchCoinGeckoGlobal();
  return g?.stablecoinDominance ?? null;
}
