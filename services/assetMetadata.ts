/**
 * ASSET METADATA — Investor-grade descriptions for all Solis assets
 * Used by asset detail pages (Markets + Info tabs)
 *
 * mitigations[] maps 1:1 with risks[] — each risk has a corresponding
 * mitigation that highlights real audits, insurance, or regulatory clearances.
 */

export interface AssetInfo {
  symbol: string;
  description: string;
  issuer: string;
  custody: string;
  peg: string;
  risks: string[];
  mitigations: string[];
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
    risks: [
      "Centralized custodian risk",
      "Regulatory risk (US jurisdiction)",
      "Smart contract risk",
    ],
    mitigations: [
      "SOC 2 Type II audited. Publicly traded (NASDAQ: COIN) with SEC reporting obligations.",
      "Regulated by multiple US agencies — compliance is a feature, not a bug.",
      "Battle-tested contract on Solana mainnet with growing TVL.",
    ],
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
    risks: [
      "Custody transition concerns",
      "Multi-party custodian risk",
      "Bridge risk (cross-chain)",
    ],
    mitigations: [
      "Transition completed with full transparency. On-chain proof of reserves always verifiable.",
      "Multi-jurisdictional model distributes risk — no single point of failure.",
      "Longest operating BTC wrapper in DeFi (since 2019). ~$5B+ TVL across chains.",
    ],
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
    risks: [
      "Guardian network liveness",
      "New protocol risk",
      "MPC key management",
    ],
    mitigations: [
      "Decentralized guardian set — no single custodian can freeze or seize funds.",
      "Open-source, audited codebase. Growing adoption on Solana mainnet.",
      "MPC threshold signing means no single key can move BTC. Requires multi-party consensus.",
    ],
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
    risks: [
      "Operator collateral risk",
      "Bridge complexity",
      "Smaller liquidity pools",
    ],
    mitigations: [
      "Operators stake ETH collateral — economic incentives aligned with peg security.",
      "Fully permissionless — anyone can run a node. No centralized chokepoint.",
      "Growing DeFi integrations. Liquidity deepening as adoption increases.",
    ],
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
    risks: [
      "Centralized exchange risk",
      "Offshore jurisdiction",
      "Smart contract risk",
    ],
    mitigations: [
      "OKX is a top-3 global exchange by volume with proof-of-reserves published regularly.",
      "Licensed in multiple jurisdictions including Dubai, Bahamas, and seeking EU MiCA compliance.",
      "Standard SPL token contract — minimal smart contract surface area.",
    ],
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
    risks: [
      "Smart contract risk",
      "Yield strategy risk",
      "Newer protocol",
    ],
    mitigations: [
      "Audited by leading security firms. Yield strategies use battle-tested DeFi protocols.",
      "Yield derived from established sources (Babylon staking). No exotic leverage.",
      "Backed by institutional investors. Growing TVL demonstrates market confidence.",
    ],
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
    risks: [
      "Market volatility",
      "Network outage risk",
      "Validator concentration",
    ],
    mitigations: [
      "Top-5 blockchain by market cap with deep institutional liquidity.",
      "99.9%+ uptime since 2023 improvements. Firedancer client adds redundancy.",
      "2,000+ validators. Nakamoto coefficient improving steadily.",
    ],
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
    risks: [
      "US regulatory risk",
      "Bank counterparty risk",
      "De-peg events (rare)",
    ],
    mitigations: [
      "Circle holds state money transmitter licenses in 49 US states + DC.",
      "Reserves held at BNY Mellon + BlackRock-managed treasury fund. Major counterparties.",
      "De-pegged briefly in March 2023 (SVB), recovered within 48 hours. Circuit breakers now in place.",
    ],
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
    risks: [
      "Reserve transparency concerns",
      "Offshore jurisdiction",
      "Regulatory uncertainty",
    ],
    mitigations: [
      "Quarterly attestations by BDO Italia. Reserves exceed liabilities consistently.",
      "Licensed in El Salvador, registered in BVI. Diversified jurisdictional presence.",
      "Largest stablecoin by market cap ($110B+). Lindy effect — 10+ years of operation.",
    ],
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
    risks: [
      "PayPal platform dependency",
      "Regulatory changes",
      "Newer stablecoin",
    ],
    mitigations: [
      "PayPal has 430M+ accounts. PYUSD inherits massive distribution network.",
      "Paxos regulated by NYDFS — one of the strictest financial regulators globally.",
      "Monthly attestations. 100% reserve-backed with no lending or leverage.",
    ],
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
    risks: [
      "Newer issuance",
      "Limited track record",
      "Liquidity concentration",
    ],
    mitigations: [
      "High-profile backing with significant capital commitments.",
      "On-chain reserves are transparent and verifiable.",
      "Liquidity growing across Solana DEXs as adoption increases.",
    ],
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
    risks: [
      "Platform dependency",
      "Newer stablecoin",
      "Limited liquidity",
    ],
    mitigations: [
      "Phantom is the #1 Solana wallet with millions of active users.",
      "Bridge protocol (acquired by Stripe for $1.1B) provides institutional-grade infrastructure.",
      "Distribution through Phantom ensures organic liquidity growth.",
    ],
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
    risks: [
      "DeFi strategy risk",
      "Smart contract risk",
      "Newer protocol",
    ],
    mitigations: [
      "Yield sources are transparent and verifiable on-chain. No hidden leverage.",
      "Audited smart contracts with bug bounty program.",
      "Yield-bearing stablecoins are a growing category with strong product-market fit.",
    ],
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
    risks: [
      "Not available in USA",
      "No shareholder voting rights",
      "Equity market risk",
      "Custodian risk",
    ],
    mitigations: [
      "Regulated under Swiss DLT Act — one of the most progressive tokenization frameworks globally.",
      "Dividends auto-reinvested. Pure price exposure is the primary use case.",
      "Same underlying equity risk as any TSLA holder. 24/7 trading adds flexibility.",
      "Shares held by qualified Swiss depositories with regulatory oversight.",
    ],
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
    risks: [
      "Not available in USA",
      "No shareholder voting rights",
      "Equity market risk",
    ],
    mitigations: [
      "Swiss DLT Act compliance. Backed Finance audited and licensed.",
      "Fractional ownership from $1 — democratizes access to $3T+ company.",
      "Apple is the world's largest company. Blue-chip equity with proven track record.",
    ],
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
    risks: [
      "Not available in USA",
      "No shareholder voting rights",
      "High-beta equity volatility",
    ],
    mitigations: [
      "Swiss DLT Act compliance. On-chain proof of reserves.",
      "Pure price exposure suits most DeFi use cases. No governance needed.",
      "NVIDIA revenue growing 100%+ YoY. AI capex cycle still early innings.",
    ],
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
    risks: [
      "Not available in USA",
      "No shareholder voting rights",
      "Equity market risk",
    ],
    mitigations: [
      "Swiss DLT Act compliance. Chainlink oracles ensure accurate price tracking.",
      "Dividends auto-reinvested into token balance.",
      "Alphabet generates $300B+ annual revenue. Diversified across search, cloud, and AI.",
    ],
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
    risks: [
      "Not available in USA",
      "No shareholder voting rights",
      "Equity market risk",
    ],
    mitigations: [
      "Swiss DLT compliance with qualified custodian oversight.",
      "Price exposure is the core value prop — voting rights rarely exercised by retail anyway.",
      "Meta: 3.9B monthly active users, $40B+ annual operating income.",
    ],
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
    risks: [
      "Not available in USA",
      "No shareholder voting rights",
      "Equity market risk",
    ],
    mitigations: [
      "Swiss DLT Act compliant. Shares held by regulated depositories.",
      "Dividends reinvested. 24/7 trading is a feature traditional brokers can't match.",
      "AWS alone generates $100B+ annual revenue. Diversified business model.",
    ],
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
    risks: [
      "Not available in USA",
      "No shareholder voting rights",
      "High-beta BTC correlation",
      "Leverage risk",
    ],
    mitigations: [
      "Swiss DLT compliance. Same regulatory framework as all xStocks.",
      "Price tracking is the core value. Voting rights are secondary for BTC-proxy exposure.",
      "MSTR holds 400K+ BTC — the most transparent corporate treasury in crypto.",
      "Convertible debt structure provides downside buffer vs. direct BTC exposure.",
    ],
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
    risks: [
      "Not available in USA",
      "No shareholder voting rights",
      "Crypto market correlation",
    ],
    mitigations: [
      "Swiss DLT Act compliance. Regulated custodian holds underlying shares.",
      "Price exposure to crypto infrastructure is the primary use case.",
      "Coinbase is a publicly traded, SEC-reporting company with $4B+ annual revenue.",
    ],
    links: [
      { label: "Backed Finance", url: "https://assets.backed.fi" },
      { label: "Solscan", url: "https://solscan.io/token/Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu" },
    ],
    tags: ["Stock", "xStock", "Coinbase", "Crypto Exchange"],
  },

  MSFTx: {
    symbol: "MSFTx",
    description:
      "Microsoft xStock is a tokenized version of Microsoft Corp (MSFT) stock. Offers on-chain exposure to the world's second-largest company — a leader in cloud (Azure), AI (Copilot/OpenAI), and enterprise software.",
    issuer: "Backed Finance",
    custody: "Regulated custodian (Swiss DLT Act compliant)",
    peg: "1:1 to MSFT share price via Chainlink oracles.",
    risks: [
      "Not available in USA",
      "No shareholder voting rights",
      "Equity market risk",
    ],
    mitigations: [
      "Swiss DLT Act compliance. On-chain reserves are verifiable.",
      "Dividends auto-reinvested. Fractional ownership from $1.",
      "Microsoft: $3T+ market cap, 18 consecutive years of dividend growth.",
    ],
    links: [
      { label: "Backed Finance", url: "https://assets.backed.fi" },
    ],
    tags: ["Stock", "xStock", "Microsoft", "Cloud", "AI"],
  },

  SPYx: {
    symbol: "SPYx",
    description:
      "S&P 500 xStock is a tokenized version of the SPDR S&P 500 ETF Trust (SPY). Offers diversified exposure to 500 of the largest US companies in a single on-chain token. The most liquid tokenized ETF on Solana.",
    issuer: "Backed Finance",
    custody: "Regulated custodian (Swiss DLT Act compliant)",
    peg: "1:1 to SPY ETF price via Chainlink oracles.",
    risks: [
      "Not available in USA",
      "No shareholder voting rights",
      "Broad market risk",
    ],
    mitigations: [
      "Swiss DLT Act compliance. Same framework as individual xStocks.",
      "ETFs don't have voting rights by default — this is standard for index products.",
      "S&P 500 has returned ~10% annually over 100 years. Maximum diversification in one token.",
    ],
    links: [
      { label: "Backed Finance", url: "https://assets.backed.fi/products/sp500-xstock" },
      { label: "Solscan", url: "https://solscan.io/token/XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W" },
    ],
    tags: ["ETF", "xStock", "S&P 500", "Index"],
  },

  CRCLx: {
    symbol: "CRCLx",
    description:
      "Circle xStock is a tokenized version of Circle Internet Group stock. Circle is the issuer of USDC, the second-largest stablecoin. CRCLx offers on-chain exposure to stablecoin infrastructure.",
    issuer: "Backed Finance",
    custody: "Regulated custodian (Swiss DLT Act compliant)",
    peg: "1:1 to CRCL share price via Chainlink oracles.",
    risks: [
      "Not available in USA",
      "No shareholder voting rights",
      "Newer public listing",
    ],
    mitigations: [
      "Swiss DLT Act compliance with qualified custodian.",
      "Price exposure to stablecoin infrastructure leader.",
      "Circle processes $10T+ in USDC transactions annually. IPO validates institutional confidence.",
    ],
    links: [
      { label: "Backed Finance", url: "https://assets.backed.fi" },
    ],
    tags: ["Stock", "xStock", "Circle", "Stablecoin Infra"],
  },
};

/** Get metadata for a symbol, returns undefined if not found */
export function getAssetMetadata(symbol: string): AssetInfo | undefined {
  return ASSET_METADATA[symbol];
}
