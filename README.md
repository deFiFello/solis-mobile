# SOLIS MOBILE

**24/7 Capital Markets on Solana Mobile**

Native trading app for the Seeker device. Trade Bitcoin wrappers, stablecoins, and tokenized stocks with real-time fundamentals, Seeker-native fee tiers, and a path to on-chain revenue sharing.

**Web Platform:** [solis-tokenized-markets.vercel.app](https://solis-tokenized-markets.vercel.app)
**Web Repo:** [deFiFello/solis-icm-directory](https://github.com/deFiFello/solis-icm-directory)

---

## What It Does

Solis turns your Seeker into a capital markets terminal. Self-custody, 24/7, no brokers, no banks, no market hours.

**22 tokenized assets across 4 categories:**
- **6 BTC Wrappers** — cbBTC, WBTC, zBTC, tBTC, xBTC, LBTC
- **6 Stablecoins** — USDC, USDT, PYUSD, USD1, CASH, hyUSD
- **9 Tokenized Stocks** — TSLAx, NVDAx, AAPLx, GOOGLx, AMZNx, MSFTx, METAx, MSTRx, COINx, SPYx, CRCLx
- **1 Base Layer** — SOL

Every swap executes on Solana mainnet with real tokens.

---

## Features

### Mainnet Jupiter Swaps
- Native swap execution via MWA (Mobile Wallet Adapter) + Seed Vault
- Smart ATA fee routing — includes platform fee when possible, skips gracefully when not. Swaps never break.
- Priority fees at 500K–1M lamports for reliable transaction landing
- Full token selector with wallet balances and USD conversion

### Seeker Integration

**Genesis Token Detection** — On wallet connection, queries Token-2022 program for Seeker Genesis Token. Verified holders unlock Seeker Mode with reduced fees.

**Fee Structure:**

| User | Fee | Details |
|------|-----|---------|
| Standard | 0.50% | Default for all users |
| Seeker Verified | **Free** up to $5K volume | First $5,000 in swap volume fee-waived |
| Seeker Verified | 0.35% | After $5K threshold, permanent reduced rate |

### Tokenized Stock Fundamentals
Real equity data from Finnhub for all xStocks:
- P/E Ratio (TTM), EPS (TTM), Beta (5Y), 52 Week Range
- Day's Range with visual position indicator
- Last Reported EPS with beat/miss and reporting period
- Analyst Consensus (Buy/Hold/Sell distribution)
- Peg Status — real stock price vs token price accuracy

### Contextual Market Intelligence
Different asset types show contextually appropriate metrics:
- **xStocks**: DEX Volume + On-Chain Liquidity (not misleading market cap)
- **BTC Wrappers**: On-Chain Volume + Wrapped TVL
- **Stablecoins/Crypto**: Standard Volume + Market Cap

Data from DexScreener, Jupiter V3, CoinGecko, Finnhub, and Pyth — fetched in parallel.

### Asset Detail Pages
2-tab layout (Markets + Info) for every asset:
- Animated count-up numbers, sparkline bars from real pool data, top-pool highlight
- Investor-grade descriptions with issuer, custody model, peg mechanism
- Balanced Considerations — each risk paired with a factual mitigation (audits, regulatory status, insurance)
- Mint address with Copy + Solscan actions

### Shadow Swaps (ZK Privacy — Web)
PrivacyCash integration on the web platform. groth16 ZK proofs generated in-browser via WASM circuits. Shield deposits break the on-chain link between sender and recipient. Mobile implementation pending — PrivacyCash SDK's Keypair requirement conflicts with MWA's secure enclave model.

### Brand V2 Design System
- #BDFF00 Solar Green accent, Inter + Space Grotesk typography
- Sharp corners, flat black palette, purple reserved for Shadow branding

---

## Revenue Model

### Active Revenue (Live)

| Stream | Fee | Status |
|--------|-----|--------|
| Standard Swaps | 0.50% | **Collecting** |
| Seeker Verified (after $5K) | 0.35% | **Collecting** |
| Seeker Verified (first $5K) | Free | **Active** |
| Shadow Swaps (Web) | 0.75% | **Collecting** |

**Fee wallet:** `EMp2t1K5Du4sQLA5v2YGKfCWjsLE2T5eNbhYjGGLRcLo`

### Planned: On-Chain Revenue Sharing

Solis is building toward a revenue sharing model where platform trading fees are deployed into DeFi yield strategies and a percentage of returns are distributed back to users.

**Architecture (in design):**
- **Triple-vault system** — GlobalState for protocol config, per-user volume tracking via PDAs, and a yield-generating vault supplied to lending protocols
- **Yield generation** — Collected fees are supplied to established lending protocols to earn APY
- **User rebates** — A percentage of vault returns distributed to users proportional to their platform activity
- **Lazy claim model** — Users initiate on-chain withdrawal of their share, shifting gas costs to the claimant

**Phased rollout:**
- **Phase 1 (Current)** — Off-chain volume tracking. Fee collection via existing Jupiter integration. Treasury accumulation.
- **Phase 2** — On-chain program deployment once treasury and volume thresholds justify the infrastructure cost (PDA rent, audit fees)
- **Phase 3** — Automated snapshot triggers and claim functionality. Modular vault strategy supporting multiple lending protocols.

The program will be built with audit readiness in mind — modular architecture, checked math, re-entrancy protection, and sharded PDAs to prevent account contention.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | React Native + Expo (SDK 54) |
| Language | TypeScript |
| Wallet | Mobile Wallet Adapter + Seed Vault |
| Swaps | Jupiter API v1 |
| Stock Data | Finnhub API |
| Market Data | DexScreener, Jupiter V3, CoinGecko |
| Macro Data | Pyth Network |
| Privacy | PrivacyCash SDK (web) |
| RPC | Helius |

---

## Architecture

```
solis-mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx            # Home (portfolio + ticker + holdings)
│   │   ├── earn.tsx             # Yield opportunities
│   │   ├── swap.tsx             # Native Jupiter swap
│   │   └── more.tsx             # Links, fees, about
│   ├── asset/[symbol].tsx       # Asset detail (Markets + Info)
│   └── _layout.tsx              # Root layout
├── contexts/
│   ├── WalletProvider.tsx       # MWA wallet + balances
│   ├── SeekerProvider.tsx       # Genesis Token + fee tiers
│   └── PortfolioProvider.tsx    # Portfolio aggregation
├── services/
│   ├── config.ts                # 22 assets, mints, API config
│   ├── assetMetadata.ts         # Descriptions, risks, mitigations
│   ├── finnhub.ts               # Stock fundamentals
│   ├── jupiterPrice.ts          # Price feeds
│   ├── dexScreener.ts           # Pool data
│   └── macroData.ts             # Macro indicators
├── lib/
│   ├── jupiterSwap.ts           # Swap execution + ATA fees
│   ├── seekerDetection.ts       # Genesis Token scan
│   └── feeTiers.ts              # Fee tier logic
└── assets/tokens/               # Local token logos
```

---

## Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| **V1** | Web platform — 14 assets, Jupiter swaps, PrivacyCash ZK shielding | ✅ Shipped |
| **V1.1** | Bug fixes — mobile responsive, RPC, WASM deployment, Shield Mode working | ✅ Shipped |
| **V2 Mobile** | Native Seeker app — 22 assets, MWA swaps, Finnhub fundamentals, fee tiers | ✅ Current |
| **V2.1** | Polish — onboarding flow, Earn screen content, xStock price feeds | 🔧 Next |
| **V3** | Revenue sharing — on-chain vault, yield generation, user rebates | 📐 Designing |
| **V4** | Tokenized metals (XAUT, PAXG), commodities, advanced charting | 📋 Planned |

---

## Setup

```bash
git clone https://github.com/deFiFello/solis-mobile.git
cd solis-mobile
npm install
npx expo start
```

Requires Node.js 18+, Expo CLI. For Seeker device testing, use Expo Go or build a dev client via Android Studio.

---

## Known Limitations

- Shadow Swaps are web-only — MWA security model prevents native PrivacyCash integration
- CoinGecko free tier rate-limits extended market data on rapid navigation
- Fee wallet needs ATAs for USDT, PYUSD, cbBTC, WBTC to collect fees on those outputs
- Finnhub price-target endpoint is premium-only (analyst targets not shown)

---

## Team

**Chris** — Solo founder

---

## License

MIT
