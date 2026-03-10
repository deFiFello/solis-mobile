// ═══════════════════════════════════════════════════════════
// FINNHUB SERVICE — Stock Fundamentals for xStocks
// File: services/finnhub.ts
// ═══════════════════════════════════════════════════════════
// Free tier: 60 calls/minute, no credit card
// Endpoints: /quote, /stock/metric, /stock/price-target,
//            /stock/recommendation, /stock/earnings

const FINNHUB_KEY = "d6mrev1r01qir35i68jgd6mrev1r01qir35i68k0";
const BASE = "https://finnhub.io/api/v1";

// ─── Symbol Map: xStock symbol → real ticker ─────────────
const XSTOCK_TO_TICKER: Record<string, string> = {
  TSLAx: "TSLA",
  NVDAx: "NVDA",
  AAPLx: "AAPL",
  GOOGLx: "GOOGL",
  AMZNx: "AMZN",
  MSFTx: "MSFT",
  METAx: "META",
  MSTRx: "MSTR",
  COINx: "COIN",
  SPYx: "SPY",
  CRCLx: "CRCL",
};

export function getRealTicker(symbol: string): string | null {
  return XSTOCK_TO_TICKER[symbol] || null;
}

export function isXStock(symbol: string): boolean {
  return symbol in XSTOCK_TO_TICKER;
}

// ─── Types ────────────────────────────────────────────────
export interface StockQuote {
  current: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  change: number;
  changePct: number;
  timestamp: number;
}

export interface StockMetrics {
  peRatio: number;
  epsTTM: number;
  beta: number;
  weekHigh52: number;
  weekLow52: number;
  marketCap: number;
  dividendYield: number;
  payoutRatio: number;
  revenuePerShare: number;
  bookValue: number;
  roe: number;
}

export interface PriceTarget {
  high: number;
  low: number;
  mean: number;
  median: number;
  count: number;
}

export interface AnalystRecommendation {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
}

export interface EarningsData {
  actual: number;
  estimate: number;
  surprise: number;
  surprisePct: number;
  period: string;
  quarter: number;
  year: number;
}

export interface StockFundamentals {
  quote: StockQuote | null;
  metrics: StockMetrics | null;
  priceTarget: PriceTarget | null;
  recommendation: AnalystRecommendation | null;
  earnings: EarningsData | null;
  ticker: string;
}

// ─── API Helpers ──────────────────────────────────────────
async function fhFetch(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set("token", FINNHUB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn(`[Finnhub] ${res.status} for ${endpoint}`);
      return null;
    }
    return await res.json();
  } catch (e: any) {
    console.warn(`[Finnhub] Failed ${endpoint}: ${e.message}`);
    return null;
  }
}

// ─── Fetch All Stock Fundamentals ─────────────────────────
export async function getStockFundamentals(xStockSymbol: string): Promise<StockFundamentals | null> {
  const ticker = getRealTicker(xStockSymbol);
  if (!ticker) return null;

  // Parallel fetch all endpoints (price-target excluded — premium only on free tier)
  const [quoteData, metricsData, recData, earningsData] = await Promise.all([
    fhFetch("/quote", { symbol: ticker }),
    fhFetch("/stock/metric", { symbol: ticker, metric: "all" }),
    fhFetch("/stock/recommendation", { symbol: ticker }),
    fhFetch("/stock/earnings", { symbol: ticker, limit: "1" }),
  ]);

  // Parse quote
  let quote: StockQuote | null = null;
  if (quoteData && quoteData.c) {
    quote = {
      current: quoteData.c || 0,
      high: quoteData.h || 0,
      low: quoteData.l || 0,
      open: quoteData.o || 0,
      prevClose: quoteData.pc || 0,
      change: quoteData.d || 0,
      changePct: quoteData.dp || 0,
      timestamp: quoteData.t || 0,
    };
  }

  // Parse metrics
  let metrics: StockMetrics | null = null;
  if (metricsData?.metric) {
    const m = metricsData.metric;
    metrics = {
      peRatio: m.peNormalizedAnnual || m.peBasicExclExtraTTM || m.peTTM || 0,
      epsTTM: m.epsNormalizedAnnual || m.epsBasicExclExtraItemsTTM || m.epsTTM || 0,
      beta: m.beta || 0,
      weekHigh52: m["52WeekHigh"] || 0,
      weekLow52: m["52WeekLow"] || 0,
      marketCap: m.marketCapitalization || 0,
      dividendYield: m.dividendYieldIndicatedAnnual || m.dividendYield5Y || 0,
      payoutRatio: m.payoutRatioTTM || 0,
      revenuePerShare: m.revenuePerShareTTM || 0,
      bookValue: m.bookValuePerShareQuarterly || 0,
      roe: m.roeTTM || 0,
    };
  }

  // Price target — not available on free tier
  const priceTarget: PriceTarget | null = null;

  // Parse recommendation (latest)
  let recommendation: AnalystRecommendation | null = null;
  if (Array.isArray(recData) && recData.length > 0) {
    const latest = recData[0];
    recommendation = {
      buy: latest.buy || 0,
      hold: latest.hold || 0,
      sell: latest.sell || 0,
      strongBuy: latest.strongBuy || 0,
      strongSell: latest.strongSell || 0,
      period: latest.period || "",
    };
  }

  // Parse earnings (latest)
  let earnings: EarningsData | null = null;
  if (Array.isArray(earningsData) && earningsData.length > 0) {
    const latest = earningsData[0];
    earnings = {
      actual: latest.actual || 0,
      estimate: latest.estimate || 0,
      surprise: latest.surprise || 0,
      surprisePct: latest.surprisePercent || 0,
      period: latest.period || "",
      quarter: latest.quarter || 0,
      year: latest.year || 0,
    };
  }

  return { quote, metrics, priceTarget, recommendation, earnings, ticker };
}
