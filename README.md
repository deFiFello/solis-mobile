# SOLIS MOBILE
## 24/7 Capital Markets on Solana Seeker

Native trading app for tokenized assets — Bitcoin wrappers, stablecoins, and tokenized stocks. Self-custody, 24/7, built for Solana Mobile.

**Monolith Hackathon Submission** — Deadline March 9, 2026

---

## What It Does

Trade 22 tokenized assets on Solana mainnet directly from your Seeker. Jupiter swap routing with MWA/Seed Vault signing. Genesis Token detection for reduced fees. Live market data from CoinGecko, DexScreener, Pyth, and Helius.

### Assets (22)
- **6 BTC wrappers**: cbBTC, WBTC, zBTC, tBTC, xBTC, LBTC
- **1 base layer**: SOL
- **6 stablecoins**: USDC, USDT, PYUSD, USD1, CASH, hyUSD
- **9 xStocks**: TSLAx, NVDAx, AAPLx, GOOGLx, AMZNx, MSFTx, METAx, SPYx, CRCLx

### Revenue
Platform fee collected via Jupiter `platformFeeBps` on every swap. 0.50% standard, 0.35% for Seeker Genesis Token holders. Fee wallet: 

---

## Quick Start

### Prerequisites
- Node.js 18+
- Android Studio with SDK 36 and Java 17+
- Seeker device with USB debugging enabled
- Phantom or Solflare wallet installed on Seeker

### Install
```bash
cd solis-mobile
npm install --legacy-peer-deps
```

### Run (Development Build)
```bash
npx expo run:android
```
Compiles a native dev client with MWA support, installs on Seeker via USB, and starts Metro bundler. First build takes ~2 minutes; subsequent runs reuse the cached build.

> **Expo Go will NOT work for swap functionality.** MWA requires a custom dev build. Use `npx expo run:android` for the full experience, or `npx expo start --dev-client` after the first build.

### Run (After First Build)
```bash
npx expo start --dev-client
```
Opens Metro bundler. The dev client on your Seeker connects automatically over USB or WiFi.

---

## Screens

### MARKETS (Home)
Portfolio carousel with total USD holdings and 24h change. Scrolling macro ticker with live Pyth data (S&P 500, NASDAQ, GOLD, SOL, DOW, OIL, 10Y Treasury). Category filters (ALL, BTC, SOL, STABLES, STOCKS). Holdings list with live prices, count-up animations, flash-on-change indicators. Tap any asset for detail page.

### SWAP
Native Jupiter swap with MWA signing on Solana mainnet. Token selector with 22 assets and wallet balance display. Live quote polling with rate, price impact, route, and platform fee. Percentage buttons (25%, 50%, 75%, MAX). Transaction confirmation with Solscan deep links. Shadow Mode tab with ZK privacy explainer (coming to mobile).

### EARN
Planned yield protocol integrations — Kamino Finance, Meteora, Marinade Finance, Jito, Drift Protocol. Shows protocol types, supported assets, and fee model (referral only, no extra cost to user). Coming soon.

### MORE
Platform links (web app, docs, fee wallet on Solscan, GitHub). Ecosystem links (Jupiter, PrivacyCash, Solana Mobile, Helius). Connected wallet info with Seeker fee tier display. Complete fee breakdown. About section with platform stats.

### Asset Detail
Dynamic route for all 22 assets. 2-tab layout (Markets + Info). DexScreener pool integration with live liquidity. Investor-grade descriptions covering custody model, backing, risk factors. Regulatory disclaimers for xStocks.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| Wallet | Mobile Wallet Adapter (MWA) + Seed Vault |
| Swaps | Jupiter API v1 (`api.jup.ag/swap/v1`) |
| Prices | CoinGecko (primary) + Jupiter V3 (fallback) |
| Market Data | DexScreener (pools), Pyth Network (macro), Helius (metadata) |
| RPC | Helius (`mainnet.helius-rpc.com`) |
| Design | Brand V2 — #BDFF00 Solar Green, Inter + Space Grotesk, sharp corners |
| Build | Android Studio SDK 36, Java 17+ |

---

## Seeker Integration

### Genesis Token Detection
On wallet connection, queries Token-2022 program for Seeker Genesis Token (SGT). Checks mint authority against `GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4`.


### SKR as Tradeable Asset
SKR token (`SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3`) included in asset list with full detail page, swappable via Jupiter.

---

## Shadow Swaps (Coming to Mobile)

ZK-shielded swaps via PrivacyCash protocol. Live on Solis web platform. Mobile integration pending resolution of architectural conflict between PrivacyCash SDK (requires raw Keypair access) and MWA/Seed Vault (private keys never leave secure enclave). See sprint report for full technical analysis.

---

## File Structure

```
solis-mobile/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab bar (MARKETS | EARN | SWAP | MORE)
│   │   ├── index.tsx            # Home screen
│   │   ├── earn.tsx             # Yield opportunities
│   │   ├── swap.tsx             # Jupiter swap + Shadow explainer
│   │   └── more.tsx             # Links, info, fees
│   ├── asset/[symbol].tsx       # Asset detail (2-tab)
│   └── _layout.tsx              # Root layout with providers
├── components/
│   ├── TokenLogo.tsx            # Logo with local/remote/branded fallbacks
│   └── HoldingRow.tsx           # Asset row in holdings list
├── contexts/
│   ├── WalletProvider.tsx       # MWA connection + balance tracking
│   ├── SeekerProvider.tsx       # Genesis Token detection + fee tiers
│   └── PortfolioProvider.tsx    # Portfolio aggregation
├── services/
│   ├── config.ts                # Token mints, API keys, SOLIS_ASSETS (22)
│   ├── assetMetadata.ts         # Descriptions for all assets
│   ├── jupiterPrice.ts          # CoinGecko + Jupiter V3 fallback
│   ├── dexScreener.ts           # Pool and market data
│   ├── heliusMetadata.ts        # Token metadata (batch)
│   ├── macroData.ts             # Macro ticker data
│   └── pythPrices.ts            # Pyth oracle feeds
├── lib/
│   ├── jupiterSwap.ts           # Swap execution + smart ATA fee routing
│   ├── seekerDetection.ts       # Genesis Token scan
│   └── feeTiers.ts              # Fee tier calculation
├── assets/tokens/               # Local PNG logos
└── android/                     # Native build output
```

---


---

## Links

- **Web Platform**: https://solis-tokenized-markets.vercel.app
- **Web Repo**: https://github.com/deFiFello/solis-icm-directory
- **Fee Wallet**: https://solscan.io/account/EMp2t1K5Du4sQLA5v2YGKfCWjsLE2T5eNbhYjGGLRcLo
