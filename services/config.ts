// @ts-nocheck
// Token Mint Addresses - VERIFIED WORKING
export const BTC_MINTS = {
  cbBTC: "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
  WBTC: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
  zBTC: "zBTCug3er3tLyffELcvDNrKkCymbPWysGcWihESYfLg",
  tBTC: "6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU",
  xBTC: "CtzPWv73Sn1dMGVU3ZtLv9yWSyUAanBni19YWDaznnkn",
  LBTC: "LBTCgU4b3wsFKsPwBn1rRZDx5DoFutM6RPiEt1TPDsY",
} as const;

export const COMMON_MINTS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
} as const;

export const EXTENDED_MINTS = {
  PYUSD: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
  USD1: "USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB",
  CASH: "CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH",
  hyUSD: "5YMkXAYccHSGnHn9nob9xEvv6Pvka9DZWH7nTbotTu9E",
} as const;

// xStocks by Backed Finance — verified mint addresses (Solscan/Solflare)
export const STOCK_MINTS = {
  TSLAx: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
  AAPLx: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
  NVDAx: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
  GOOGLx: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN",
  METAx: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu",
  AMZNx: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg",
  MSTRx: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ",
  COINx: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu",
  SPYx: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
} as const;

export const SOLIS_ASSETS = [
  // BTC Wrappers (6)
  { symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', mint: BTC_MINTS.cbBTC, decimals: 8, category: 'btc' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', mint: BTC_MINTS.WBTC, decimals: 8, category: 'btc' },
  { symbol: 'zBTC', name: 'Zeus Network BTC', mint: BTC_MINTS.zBTC, decimals: 8, category: 'btc' },
  { symbol: 'tBTC', name: 'Threshold BTC', mint: BTC_MINTS.tBTC, decimals: 8, category: 'btc' },
  { symbol: 'xBTC', name: 'OKX Wrapped BTC', mint: BTC_MINTS.xBTC, decimals: 8, category: 'btc' },
  { symbol: 'LBTC', name: 'Lombard Staked BTC', mint: BTC_MINTS.LBTC, decimals: 8, category: 'btc' },
  // Base Layer (1)
  { symbol: 'SOL', name: 'Solana', mint: COMMON_MINTS.SOL, decimals: 9, category: 'crypto' },
  // Stablecoins (6)
  { symbol: 'USDC', name: 'USD Coin', mint: COMMON_MINTS.USDC, decimals: 6, category: 'stable' },
  { symbol: 'USDT', name: 'Tether USD', mint: COMMON_MINTS.USDT, decimals: 6, category: 'stable' },
  { symbol: 'PYUSD', name: 'PayPal USD', mint: EXTENDED_MINTS.PYUSD, decimals: 6, category: 'stable' },
  { symbol: 'USD1', name: 'World Liberty Financial USD', mint: EXTENDED_MINTS.USD1, decimals: 6, category: 'stable' },
  { symbol: 'CASH', name: 'Phantom Cash', mint: EXTENDED_MINTS.CASH, decimals: 6, category: 'stable' },
  { symbol: 'hyUSD', name: 'Hylo USD', mint: EXTENDED_MINTS.hyUSD, decimals: 6, category: 'stable' },
  // xStocks — Tokenized Equities (9)
  { symbol: 'TSLAx', name: 'Tesla xStock', mint: STOCK_MINTS.TSLAx, decimals: 6, category: 'stock' },
  { symbol: 'AAPLx', name: 'Apple xStock', mint: STOCK_MINTS.AAPLx, decimals: 6, category: 'stock' },
  { symbol: 'NVDAx', name: 'NVIDIA xStock', mint: STOCK_MINTS.NVDAx, decimals: 6, category: 'stock' },
  { symbol: 'GOOGLx', name: 'Alphabet xStock', mint: STOCK_MINTS.GOOGLx, decimals: 6, category: 'stock' },
  { symbol: 'METAx', name: 'Meta xStock', mint: STOCK_MINTS.METAx, decimals: 6, category: 'stock' },
  { symbol: 'AMZNx', name: 'Amazon xStock', mint: STOCK_MINTS.AMZNx, decimals: 6, category: 'stock' },
  { symbol: 'MSTRx', name: 'MicroStrategy xStock', mint: STOCK_MINTS.MSTRx, decimals: 6, category: 'stock' },
  { symbol: 'COINx', name: 'Coinbase xStock', mint: STOCK_MINTS.COINx, decimals: 6, category: 'stock' },
  { symbol: 'SPYx', name: 'S&P 500 xStock', mint: STOCK_MINTS.SPYx, decimals: 6, category: 'stock' },
] as const;

/** Look up asset by symbol (case-insensitive) */
export function getAssetBySymbol(symbol: string) {
  return SOLIS_ASSETS.find(
    (a) => a.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

export const SOLIS_CONFIG = {
  JUPITER_API_KEY: process.env.EXPO_PUBLIC_JUPITER_API_KEY ?? "",
  HELIUS_API_KEY: process.env.EXPO_PUBLIC_HELIUS_API_KEY ?? "",
  HELIUS_RPC_URL: `https://mainnet.helius-rpc.com/?api-key=${process.env.EXPO_PUBLIC_HELIUS_API_KEY ?? ""}`,
  DEXSCREENER_API: "https://api.dexscreener.com/latest/dex",
  JUPITER_PRICE_API: "https://api.jup.ag/price/v2",
  JUPITER_QUOTE_API: "https://api.jup.ag/swap/v1/quote",
  PYTH_PRICE_SERVICE: "https://hermes.pyth.network/v2/updates/price/latest",
  FEE_WALLET: "EMp2t1K5Du4sQLA5v2YGKfCWjsLE2T5eNbhYjGGLRcLo",
  PLATFORM_FEE_BPS: 50,
  SHADOW_FEE_BPS: 75,
} as const;

export const API_KEYS = { JUPITER: SOLIS_CONFIG.JUPITER_API_KEY, HELIUS: SOLIS_CONFIG.HELIUS_API_KEY } as const;
export const JUPITER_API_KEY = SOLIS_CONFIG.JUPITER_API_KEY;
export const RPC_ENDPOINTS = { HELIUS: SOLIS_CONFIG.HELIUS_RPC_URL, PUBLIC: "https://api.mainnet-beta.solana.com" } as const;
export const SKR_MINT = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";
export const SGT_MINT_AUTHORITY = "GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4";
