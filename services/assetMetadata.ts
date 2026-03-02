/**
 * ASSET METADATA — Investor-grade descriptions for all Solis assets
 * Used by asset detail pages (Markets + Info tabs)
 */

export interface AssetInfo {
  symbol: string;
  description: string;
  issuer: string;
  custody: string;
  peg: string;
  risks: string[];
  links: { label: string; url: string }[];
  tags: string[];
}

export const ASSET_METADATA: Record<string, AssetInfo> = {
  // ═══════════════════════════════════════════════════
  // BTC WRAPPERS
  // ═══════════════════════════════════════════════════
  cbBTC: {
    symbol: "cbBTC",
    description:
      "Coinbase Wrapped BTC is a 1:1 Bitcoin wrapper issued by Coinbase. Each cbBTC token represents one BTC held in Coinbase's institutional-grade cold storage. Coinbase is a publicly traded company (NASDAQ: COIN) subject to US regulatory oversight.",
    issuer: "Coinbase",
    custody: "Coinbase Custody Trust Company (SOC 2 Type II, qualified custodian)",
    peg: "1:1 backed by BTC in Coinbase cold storage. Mint/burn managed by Coinbase.",
    risks: ["Centralized custodian risk", "Regulatory risk (US jurisdiction)", "Smart contract risk"],
    links: [
      { label: "Coinbase", url: "https://www.coinbase.com/cbbtc" },
      { label: "Solscan", url: "https://solscan.io/token/cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij" },
    ],
    tags: ["BTC", "Wrapped", "Institutional"],
  },

  WBTC: {
    symbol: "WBTC",
    description:
      "Wrapped Bitcoin is one of the oldest and most liquid BTC wrappers in DeFi. Originally issued by BitGo, custody transitioned to a multi-jurisdictional model in 2024. WBTC is widely integrated across Ethereum and Solana DeFi protocols.",
    issuer: "BitGo / WBTC DAO",
    custody: "Multi-jurisdictional custody (BitGo Trust, BiT Global)",
    peg: "1:1 backed by BTC. Proof of reserve verifiable on-chain.",
    risks: ["Custody transition concerns", "Multi-party custodian risk", "Bridge risk (cross-chain)"],
    links: [
      { label: "WBTC Network", url: "https://wbtc.network" },
      { label: "Solscan", url: "https://solscan.io/token/3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh" },
    ],
    tags: ["BTC", "Wrapped", "DeFi Native"],
  },

  zBTC: {
    symbol: "zBTC",
    description:
      "Zeus Network BTC is a native Bitcoin wrapper on Solana using the ZeusLayer — a decentralized network of Guardians running Multi-Party Computation (MPC). zBTC uses a verifiable 2-way peg with SPV verification on Solana.",
    issuer: "Zeus Network",
    custody: "Decentralized Guardian network (MPC-based)",
    peg: "1:1 via 2-way peg. Bitcoin deposited to Taproot addresses verified by Guardians.",
    risks: ["Guardian network liveness", "New protocol risk", "MPC key management"],
    links: [
      { label: "Zeus Network", url: "https://zeusnetwork.xyz" },
      { label: "Solscan", url: "https://solscan.io/token/zBTCug3er3tLyffELcvDNrKkCymbPWysGcWihESYfLg" },
    ],
    tags: ["BTC", "Native Bridge", "Decentralized"],
  },

  tBTC: {
    symbol: "tBTC",
    description:
      "Threshold BTC is a decentralized Bitcoin wrapper maintained by the Threshold Network. It uses a permissionless group of operators running a threshold ECDSA signing scheme — no single party can move the underlying BTC.",
    issuer: "Threshold Network",
    custody: "Decentralized threshold signing (t-ECDSA)",
    peg: "1:1 via decentralized minting. Operators stake collateral to secure the peg.",
    risks: ["Operator collateral risk", "Bridge complexity", "Smaller liquidity pools"],
    links: [
      { label: "Threshold Network", url: "https://threshold.network" },
      { label: "Solscan", url: "https://solscan.io/token/6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU" },
    ],
    tags: ["BTC", "Decentralized", "Threshold Signing"],
  },

  xBTC: {
    symbol: "xBTC",
    description:
      "OKX Wrapped BTC is issued by OKX, one of the world's largest cryptocurrency exchanges. Each xBTC represents 1 BTC held in OKX's custody infrastructure.",
    issuer: "OKX",
    custody: "OKX institutional custody",
    peg: "1:1 backed by BTC in OKX reserves.",
    risks: ["Centralized exchange risk", "Offshore jurisdiction", "Smart contract risk"],
    links: [
      { label: "OKX", url: "https://www.okx.com" },
      { label: "Solscan", url: "https://solscan.io/token/CtzPWv73Sn1dMGVU3ZtLv9yWSyUAanBni19YWDaznnkn" },
    ],
    tags: ["BTC", "Wrapped", "CEX"],
  },

  LBTC: {
    symbol: "LBTC",
    description:
      "Lombard Staked BTC represents Bitcoin that is both wrapped and earning staking yield through Lombard Finance. LBTC enables BTC holders to earn yield while maintaining Bitcoin exposure across DeFi.",
    issuer: "Lombard Finance",
    custody: "Institutional custody with yield generation",
    peg: "1:1 backed by BTC with additional staking yield accrual.",
    risks: ["Smart contract risk", "Yield strategy risk", "Newer protocol"],
    links: [
      { label: "Lombard Finance", url: "https://www.lombard.finance" },
      { label: "Solscan", url: "https://solscan.io/token/LBTCgU4b3wsFKsPwBn1rRZDx5DoFutM6RPiEt1TPDsY" },
    ],
    tags: ["BTC", "Staked", "Yield"],
  },

  // ═══════════════════════════════════════════════════
  // BASE LAYER
  // ═══════════════════════════════════════════════════
  SOL: {
    symbol: "SOL",
    description:
      "Solana is the native token of the Solana blockchain — a high-performance L1 with sub-second finality and transaction costs under $0.01. SOL is used for transaction fees, staking, and governance across the Solana ecosystem.",
    issuer: "Solana Foundation",
    custody: "Native token — self-custody in any Solana wallet",
    peg: "Market-priced. No peg mechanism.",
    risks: ["Market volatility", "Network outage risk", "Validator concentration"],
    links: [
      { label: "Solana", url: "https://solana.com" },
      { label: "Solscan", url: "https://solscan.io/token/So11111111111111111111111111111111111111112" },
    ],
    tags: ["L1", "Native", "Staking"],
  },

  // ═══════════════════════════════════════════════════
  // STABLECOINS
  // ═══════════════════════════════════════════════════
  USDC: {
    symbol: "USDC",
    description:
      "USD Coin is a fully-reserved stablecoin issued by Circle. Each USDC is backed 1:1 by US dollars and US treasuries, with regular attestations by Grant Thornton LLP. USDC is the most liquid stablecoin on Solana.",
    issuer: "Circle",
    custody: "US-regulated reserves (cash + short-term US treasuries)",
    peg: "1:1 USD. Redeemable through Circle for fiat.",
    risks: ["US regulatory risk", "Bank counterparty risk", "De-peg events (rare)"],
    links: [
      { label: "Circle", url: "https://www.circle.com/usdc" },
      { label: "Solscan", url: "https://solscan.io/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
    ],
    tags: ["Stablecoin", "USD", "Regulated"],
  },

  USDT: {
    symbol: "USDT",
    description:
      "Tether USD is the world's most traded stablecoin by volume. Issued by Tether Limited, USDT is backed by a mix of cash, cash equivalents, and other investments. It dominates global crypto trading pairs.",
    issuer: "Tether Limited",
    custody: "Mixed reserves (cash, treasuries, commercial paper, other assets)",
    peg: "1:1 USD. Redeemable through Tether for verified accounts.",
    risks: ["Reserve transparency concerns", "Offshore jurisdiction", "Regulatory uncertainty"],
    links: [
      { label: "Tether", url: "https://tether.to" },
      { label: "Solscan", url: "https://solscan.io/token/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" },
    ],
    tags: ["Stablecoin", "USD", "High Volume"],
  },

  PYUSD: {
    symbol: "PYUSD",
    description:
      "PayPal USD is a stablecoin issued by PayPal through Paxos Trust Company. Fully backed by US dollar deposits, US treasuries, and cash equivalents. Regulated by the New York Department of Financial Services.",
    issuer: "PayPal / Paxos Trust",
    custody: "Paxos Trust Company (NYDFS regulated)",
    peg: "1:1 USD. Monthly reserve attestations by independent accounting firm.",
    risks: ["PayPal platform dependency", "Regulatory changes", "Newer stablecoin"],
    links: [
      { label: "PayPal", url: "https://www.paypal.com/pyusd" },
      { label: "Solscan", url: "https://solscan.io/token/2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo" },
    ],
    tags: ["Stablecoin", "USD", "TradFi"],
  },

  USD1: {
    symbol: "USD1",
    description:
      "World Liberty Financial USD is a stablecoin associated with the World Liberty Financial platform. Backed by US dollar reserves with transparent issuance on Solana.",
    issuer: "World Liberty Financial",
    custody: "Reserve-backed custody arrangement",
    peg: "1:1 USD target.",
    risks: ["Newer issuance", "Limited track record", "Liquidity concentration"],
    links: [
      { label: "Solscan", url: "https://solscan.io/token/USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB" },
    ],
    tags: ["Stablecoin", "USD"],
  },

  CASH: {
    symbol: "CASH",
    description:
      "Phantom Cash is a stablecoin integrated into the Phantom wallet ecosystem. Designed for seamless payments and transfers within the Solana ecosystem.",
    issuer: "Phantom / Bridge",
    custody: "Reserve-backed through Bridge protocol",
    peg: "1:1 USD target.",
    risks: ["Platform dependency", "Newer stablecoin", "Limited liquidity"],
    links: [
      { label: "Solscan", url: "https://solscan.io/token/CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH" },
    ],
    tags: ["Stablecoin", "USD", "Phantom"],
  },

  hyUSD: {
    symbol: "hyUSD",
    description:
      "Hylo USD is a yield-bearing stablecoin that generates returns for holders through underlying DeFi strategies. Maintains a $1 peg while accruing yield from protocol-managed strategies.",
    issuer: "Hylo Protocol",
    custody: "Protocol-managed with underlying DeFi yield",
    peg: "1:1 USD target with yield accrual.",
    risks: ["DeFi strategy risk", "Smart contract risk", "Newer protocol"],
    links: [
      { label: "Solscan", url: "https://solscan.io/token/5YMkXAYccHSGnHn9nob9xEvv6Pvka9DZWH7nTbotTu9E" },
    ],
    tags: ["Stablecoin", "USD", "Yield-bearing"],
  },

  // ═══════════════════════════════════════════════════
  // xSTOCKS — Tokenized Equities by Backed Finance
  // ═══════════════════════════════════════════════════
  TSLAx: {
    symbol: "TSLAx",
    description:
      "Tesla xStock is a tokenized version of Tesla Inc. (TSLA) stock. Each TSLAx token is backed 1:1 by real Tesla shares held by a regulated custodian under Swiss oversight. Dividends are automatically reinvested into token balances.",
    issuer: "Backed Finance (Backed Assets JE Limited)",
    custody: "Regulated custodian (Swiss DLT Act compliant). Shares held by qualified depositories.",
    peg: "1:1 to TSLA share price. Chainlink oracles provide real-time pricing.",
    risks: ["Not available in USA", "No shareholder voting rights", "Equity market risk", "Custodian risk"],
    links: [
      { label: "Backed Finance", url: "https://assets.backed.fi/products/tesla-xstock" },
      { label: "Solscan", url: "https://solscan.io/token/XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB" },
    ],
    tags: ["Stock", "xStock", "Tesla", "EV", "AI"],
  },

  AAPLx: {
    symbol: "AAPLx",
    description:
      "Apple xStock is a tokenized version of Apple Inc. (AAPL) stock. Backed 1:1 by real Apple shares, offering 24/7 on-chain exposure to the world's largest company by market cap. Fractional ownership from $1.",
    issuer: "Backed Finance",
    custody: "Regulated custodian (Swiss DLT Act compliant)",
    peg: "1:1 to AAPL share price via Chainlink oracles.",
    risks: ["Not available in USA", "No shareholder voting rights", "Equity market risk"],
    links: [
      { label: "Backed Finance", url: "https://assets.backed.fi" },
      { label: "Solscan", url: "https://solscan.io/token/XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp" },
    ],
    tags: ["Stock", "xStock", "Apple", "Tech"],
  },

  NVDAx: {
    symbol: "NVDAx",
    description:
      "NVIDIA xStock is a tokenized version of NVIDIA Corp (NVDA) stock. NVIDIA dominates the AI chip market, making NVDAx one of the most actively traded tokenized equities on Solana with over $123M market cap on-chain.",
    issuer: "Backed Finance",
    custody: "Regulated custodian (Swiss DLT Act compliant)",
    peg: "1:1 to NVDA share price via Chainlink oracles.",
    risks: ["Not available in USA", "No shareholder voting rights", "High-beta equity volatility"],
    links: [
      { label: "Backed Finance", url: "https://assets.backed.fi" },
      { label: "Solscan", url: "https://solscan.io/token/Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh" },
    ],
    tags: ["Stock", "xStock", "NVIDIA", "AI", "Chips"],
  },

  GOOGLx: {
    symbol: "GOOGLx",
    description:
      "Alphabet xStock is a tokenized version of Alphabet Inc. (GOOGL) stock. Offers on-chain exposure to Google's parent company — spanning search, cloud, YouTube, and AI research.",
    issuer: "Backed Finance",
    custody: "Regulated custodian (Swiss DLT Act compliant)",
    peg: "1:1 to GOOGL share price via Chainlink oracles.",
    risks: ["Not available in USA", "No shareholder voting rights", "Equity market risk"],
    links: [
      { label: "Backed Finance", url: "https://assets.backed.fi" },
      { label: "Solscan", url: "https://solscan.io/token/XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN" },
    ],
    tags: ["Stock", "xStock", "Google", "AI", "Cloud"],
  },

  METAx: {
    symbol: "METAx",
    description:
      "Meta xStock is a tokenized version of Meta Platforms Inc. (META) stock. Provides on-chain exposure to the company behind Facebook, Instagram, WhatsApp, and major metaverse/AI investments.",
    issuer: "Backed Finance",
    custody: "Regulated custodian (Swiss DLT Act compliant)",
    peg: "1:1 to META share price via Chainlink oracles.",
    risks: ["Not available in USA", "No shareholder voting rights", "Equity market risk"],
    links: [
      { label: "Backed Finance", url: "https://assets.backed.fi" },
      { label: "Solscan", url: "https://solscan.io/token/Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu" },
    ],
    tags: ["Stock", "xStock", "Meta", "Social", "AI"],
  },

  AMZNx: {
    symbol: "AMZNx",
    description:
      "Amazon xStock is a tokenized version of Amazon.com Inc. (AMZN) stock. Offers 24/7 on-chain exposure to the e-commerce and cloud computing giant, including AWS — the world's largest cloud infrastructure provider.",
    issuer: "Backed Finance",
    custody: "Regulated custodian (Swiss DLT Act compliant)",
    peg: "1:1 to AMZN share price via Chainlink oracles.",
    risks: ["Not available in USA", "No shareholder voting rights", "Equity market risk"],
    links: [
      { label: "Backed Finance", url: "https://assets.backed.fi" },
      { label: "Solscan", url: "https://solscan.io/token/Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg" },
    ],
    tags: ["Stock", "xStock", "Amazon", "Cloud", "E-commerce"],
  },

  MSTRx: {
    symbol: "MSTRx",
    description:
      "MicroStrategy xStock is a tokenized version of MicroStrategy Inc. (MSTR) stock. MicroStrategy holds the largest corporate Bitcoin treasury, making MSTRx a leveraged proxy for Bitcoin exposure through public equity markets.",
    issuer: "Backed Finance",
    custody: "Regulated custodian (Swiss DLT Act compliant)",
    peg: "1:1 to MSTR share price via Chainlink oracles.",
    risks: ["Not available in USA", "No shareholder voting rights", "High-beta BTC correlation", "Leverage risk"],
    links: [
      { label: "Backed Finance", url: "https://assets.backed.fi" },
      { label: "Solscan", url: "https://solscan.io/token/XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ" },
    ],
    tags: ["Stock", "xStock", "MicroStrategy", "Bitcoin Treasury"],
  },

  COINx: {
    symbol: "COINx",
    description:
      "Coinbase xStock is a tokenized version of Coinbase Global Inc. (COIN) stock. Provides on-chain exposure to the largest US-regulated crypto exchange — a direct play on crypto market infrastructure and adoption.",
    issuer: "Backed Finance",
    custody: "Regulated custodian (Swiss DLT Act compliant)",
    peg: "1:1 to COIN share price via Chainlink oracles.",
    risks: ["Not available in USA", "No shareholder voting rights", "Crypto market correlation"],
    links: [
      { label: "Backed Finance", url: "https://assets.backed.fi" },
      { label: "Solscan", url: "https://solscan.io/token/Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu" },
    ],
    tags: ["Stock", "xStock", "Coinbase", "Crypto Exchange"],
  },

  SPYx: {
    symbol: "SPYx",
    description:
      "S&P 500 xStock is a tokenized version of the SPDR S&P 500 ETF Trust (SPY). Offers diversified exposure to 500 of the largest US companies in a single on-chain token. The most liquid tokenized ETF on Solana.",
    issuer: "Backed Finance",
    custody: "Regulated custodian (Swiss DLT Act compliant)",
    peg: "1:1 to SPY ETF price via Chainlink oracles.",
    risks: ["Not available in USA", "No shareholder voting rights", "Broad market risk"],
    links: [
      { label: "Backed Finance", url: "https://assets.backed.fi/products/sp500-xstock" },
      { label: "Solscan", url: "https://solscan.io/token/XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W" },
    ],
    tags: ["ETF", "xStock", "S&P 500", "Index"],
  },
};

/** Get metadata for a symbol, returns undefined if not found */
export function getAssetMetadata(symbol: string): AssetInfo | undefined {
  return ASSET_METADATA[symbol];
}
