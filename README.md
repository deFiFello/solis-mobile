# SOLIS MOBILE — Expo Development Build

## Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ installed
- Android Studio installed (you have this ✅)
- Seeker device in dev mode (you have this ✅)
- Expo Go app on your Seeker (install from dApp Store or Google Play)

### Setup
```bash
cd solis-mobile
npm install --legacy-peer-deps
```

### Run on Seeker
```bash
npx expo start
```

This opens the Expo dev server. You'll see a QR code in terminal.

**Option A — Expo Go (fastest):**
1. Open Expo Go app on your Seeker
2. Scan the QR code from terminal
3. App loads on device

**Option B — Same WiFi:**
1. Make sure your computer and Seeker are on the same WiFi network
2. Scan QR code with Expo Go
3. If QR doesn't work, type the URL shown in terminal (e.g., `exp://192.168.x.x:8081`)

**Option C — USB (if WiFi issues):**
```bash
npx expo start --localhost --android
```
Requires USB debugging enabled on Seeker.

### What You'll See
- **Home tab**: Portfolio carousel (Portfolio + Shadow cards), info carousel, scrolling market ticker with LIVE data from Jupiter/DexScreener/CoinGecko, Fear & Greed + BTC Dominance metrics, asset list with live prices for all 14 tokens + SKR
- **Stake tab**: SKR staking info + fee tier table
- **Swap tab**: Placeholder (will be WebView to your Vercel site)
- **More tab**: Links to docs, GitHub, Solscan fee wallet

### Live Data Sources
- **Token prices**: Jupiter Price API v2 (all 15 assets)
- **Market ticker**: Yahoo Finance (S&P, NASDAQ, GOLD, DOW, OIL, 10Y Treasury)
- **Fear & Greed**: alternative.me API
- **BTC Dominance**: CoinGecko Global API
- Pull to refresh, auto-refreshes every 30 seconds

### File Structure
```
solis-mobile/
├── app/
│   ├── _layout.tsx              # Root layout (fonts, dark theme)
│   └── (tabs)/
│       ├── _layout.tsx          # Tab nav with custom bottom bar
│       ├── index.tsx            # Home screen (the big one)
│       ├── stake.tsx            # SKR staking
│       ├── swap.tsx             # Swap placeholder
│       └── more.tsx             # Settings/links
├── services/
│   ├── config.ts                # Token mints, API keys, asset list
│   ├── jupiterPrice.ts          # Jupiter price feeds
│   ├── dexScreener.ts           # DexScreener market data
│   └── macroData.ts             # Macro indicators + metrics
├── components/                  # (empty, will add shared components)
├── app.json                     # Expo config
├── index.ts                     # Entry point
└── package.json
```

### Known Limitations (Day 1 Build)
- No wallet connection yet (needs MWA integration)
- Portfolio card shows $0.00 (no wallet = no balances)
- Swap is placeholder (WebView coming Week 2)
- Ticker auto-scroll is basic (will smooth out)
- No Seeker Genesis Token detection yet (Week 3)
- Yahoo Finance API may be blocked on some networks

### Next Steps
1. Test on Seeker → confirm live data loads
2. Iterate on home screen based on feel on real hardware
3. Add MWA wallet connection
4. Build Markets detail page
5. Integrate WebView swap
