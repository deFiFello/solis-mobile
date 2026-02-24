// Solis token configuration — ported from web codebase

export const HELIUS_API_KEY = "ee6c2238-42f8-4582-b9e5-3180f450b998";
export const JUPITER_API_KEY = "8b7d0011-2e6b-47b6-a597-2e2e36100f47";
export const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
export const FEE_WALLET = "EMp2t1K5Du4sQLA5v2YGKfCWjsLE2T5eNbhYjGGLRcLo";

export const COMMON_MINTS: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
};

export const EXTENDED_MINTS: Record<string, string> = {
  cbBTC: "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
  WBTC: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
  zBTC: "zBTCug3er3tLyffELcvDNrKkCymbPWysGcWihESYfLg",
  tBTC: "6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU",
  xBTC: "CtzPWv73Sn1dMGVU3ZtLv9yWSyUAanBni19YWDaznnkn",
  LBTC: "LBTCgU4b3wsFKsPwBn1rRZDx5DoFutM6RPiEt1TPDsY",
  PYUSD: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
  USD1: "USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB",
  CASH: "3ZGf3ERiitfTR9RCChchfo7QWmSfH1WArJ3jjrtMXnKa",
  hyUSD: "CfuSViqf6wvUKEprLhtuCsSanvfAsMbDmkAW92FP95qe",
  SKR: "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3",
};

export type SolisAsset = {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  category: "crypto" | "stablecoin" | "base";
  logoURI?: string;
};

export const SOLIS_ASSETS: SolisAsset[] = [
  // BTC Wrappers
  { symbol: "cbBTC", name: "Coinbase Wrapped BTC", mint: EXTENDED_MINTS.cbBTC, decimals: 8, category: "crypto" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", mint: EXTENDED_MINTS.WBTC, decimals: 8, category: "crypto" },
  { symbol: "zBTC", name: "Zeus Network BTC", mint: EXTENDED_MINTS.zBTC, decimals: 8, category: "crypto" },
  { symbol: "tBTC", name: "Threshold BTC", mint: EXTENDED_MINTS.tBTC, decimals: 8, category: "crypto" },
  { symbol: "xBTC", name: "OKX Wrapped BTC", mint: EXTENDED_MINTS.xBTC, decimals: 8, category: "crypto" },
  { symbol: "LBTC", name: "Lombard Staked BTC", mint: EXTENDED_MINTS.LBTC, decimals: 8, category: "crypto" },
  // Base
  { symbol: "SOL", name: "Solana", mint: COMMON_MINTS.SOL, decimals: 9, category: "base" },
  // Stablecoins
  { symbol: "USDC", name: "USD Coin", mint: COMMON_MINTS.USDC, decimals: 6, category: "stablecoin" },
  { symbol: "USDT", name: "Tether USD", mint: COMMON_MINTS.USDT, decimals: 6, category: "stablecoin" },
  { symbol: "PYUSD", name: "PayPal USD", mint: EXTENDED_MINTS.PYUSD, decimals: 6, category: "stablecoin" },
  { symbol: "USD1", name: "World Liberty Financial USD", mint: EXTENDED_MINTS.USD1, decimals: 6, category: "stablecoin" },
  { symbol: "CASH", name: "Phantom Cash", mint: EXTENDED_MINTS.CASH, decimals: 6, category: "stablecoin" },
  { symbol: "hyUSD", name: "Hylo USD", mint: EXTENDED_MINTS.hyUSD, decimals: 6, category: "stablecoin" },
  // SKR
  { symbol: "SKR", name: "Seeker Token", mint: EXTENDED_MINTS.SKR, decimals: 9, category: "crypto" },
];
