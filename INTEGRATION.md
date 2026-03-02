# SOLIS MOBILE — WALLET + SEEKER INTEGRATION
## February 24, 2026

---

## WHAT CHANGED

### New Files
- `contexts/WalletProvider.tsx` — MWA wallet connection, base64→base58 decoding, balance fetching
- `contexts/SeekerProvider.tsx` — Genesis Token detection, SKR balance, fee tier calculation
- `metro.config.js` — .cjs extension support for Solana libs

### Modified Files
- `package.json` — Added 6 dependencies: MWA protocol, @solana/web3.js, @solana/spl-token, buffer, react-native-get-random-values, expo-dev-client
- `app.json` — Added expo-dev-client plugin, newArchEnabled: false (prevents SVG/screens crashes)
- `index.ts` — Added Buffer + crypto.getRandomValues polyfills before expo-router entry
- `app/_layout.tsx` — Wrapped app in WalletProvider → SeekerProvider
- `app/(tabs)/index.tsx` — Header connects wallet, Portfolio Card shows real address/balance/Seeker badge
- `app/(tabs)/swap.tsx` — Wallet-aware connect/swap button, fee tier display
- `app/(tabs)/stake.tsx` — Real SKR balance, current tier highlight, fee tier table

---

## HOW TO APPLY

```bash
cd ~/Downloads/solis-mobile

# 1. Copy all patch files over your existing project
# (Replace existing files with the updated versions)

# 2. Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
# OR
yarn install

# 3. IMPORTANT: MWA requires a custom dev client, NOT Expo Go
# First time (builds native module — takes 5-20 min):
npx expo run:android

# After first build, start dev server:
npx expo start --dev-client --clear --reset-cache

# If local network fails:
npx expo start --dev-client --tunnel --clear --reset-cache
```

---

## CRITICAL NOTES

### MWA Does NOT Work in Expo Go
The Mobile Wallet Adapter needs native modules that aren't in Expo Go. You MUST use a custom dev client:
```bash
npx expo run:android    # Builds custom dev client with MWA native modules
```

### Base64 Address Decoding (Fixes "Array error64")
Seed Vault returns wallet addresses in base64 format. WalletProvider.tsx includes the decoder:
```typescript
if (raw.includes("+") || raw.includes("/") || raw.includes("=")) {
  const bytes = Buffer.from(raw, "base64");
  return new PublicKey(bytes).toBase58();
}
```

### newArchEnabled: false
Set in app.json to prevent the react-native-screens and SVG prop casting crashes you hit on Feb 21.

### Helius Key
Using `ee6c2238-42f8-4582-b9e5-3180f450b998` (same as web) — set in `services/config.ts`.

---

## WALLET FLOW

1. User taps CONNECT in header → triggers `transact()` with MWA
2. Seed Vault prompt appears on Seeker → user approves
3. Base64 address decoded to base58 → stored in WalletProvider state
4. Balance fetch runs: SOL (native) + all 14 SPL token ATAs
5. SeekerProvider auto-fires: checks Token-2022 for Genesis Token + SKR balance
6. Fee tier calculated: Standard (0.50%) → Seeker (0.35%) → Seeker+ (0.25%)
7. UI updates: header shows green dot + truncated address, Portfolio Card shows real data, Stake screen shows tier

---

## GENESIS TOKEN DETECTION

Checks the connected wallet for Token-2022 tokens whose mint authority matches:
```
GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4
```

If found with balance > 0 → `seekerMode: true` → fee tier drops from 0.50% to 0.35%.

---

## FEE TIERS

| Tier | Requirement | feeBps | Display |
|------|------------|--------|---------|
| Standard | No SGT | 50 | 0.50% |
| Seeker | Genesis Token | 35 | 0.35% |
| Seeker+ | SGT + 1,000 SKR | 25 | 0.25% |
| Seeker Pro | SGT + staked SKR | 15 | 0.15% |

`feeBps` value feeds directly into Jupiter `platformFeeBps` when WebView swap integration is wired.

---

## NEXT STEPS (after wallet works)

1. **Test wallet connection on Seeker** — verify base64 decoding, Genesis Token detection
2. **Markets screen** — asset detail pages (2-tab mobile: Markets + Info)
3. **Swap WebView** — bridge native wallet state → Vercel-hosted swap page
4. **Shadow Card** — wire to PrivacyCash WebView
5. **Onboarding flow** — 5-slide first-launch experience
6. **QA → APK → dApp Store → demo video → submit by March 9**
