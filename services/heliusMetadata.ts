// ═══════════════════════════════════════════════════════════
// HELIUS METADATA SERVICE
// ═══════════════════════════════════════════════════════════
// Consumer: index.tsx
//   import { getAllTokenMetadata, type TokenMetadata } from "../../services/heliusMetadata";
//   const meta = await getAllTokenMetadata();
//   // Returns Record<string, TokenMetadata> keyed by MINT address
//   // Usage: tokenMeta[asset.mint]?.logoURI

import { SOLIS_CONFIG, SOLIS_ASSETS } from "./config";

export type TokenMetadata = {
  symbol: string;
  name: string;
  logoURI: string | null;
  decimals: number;
};

const cache: Record<string, TokenMetadata> = {};

/**
 * Fetch metadata for all SOLIS_ASSETS (or custom mint list) via Helius DAS.
 * Returns Record keyed by mint address.
 * Called with no args from home screen → auto-fetches all assets.
 */
export async function getAllTokenMetadata(
  mints?: string[]
): Promise<Record<string, TokenMetadata>> {
  const ids = mints || SOLIS_ASSETS.map((a) => a.mint as string);
  const result: Record<string, TokenMetadata> = {};

  // Return cached entries
  const uncached: string[] = [];
  for (const mint of ids) {
    if (cache[mint]) {
      result[mint] = cache[mint];
    } else {
      uncached.push(mint);
    }
  }

  if (uncached.length === 0) return result;

  try {
    const res = await fetch(SOLIS_CONFIG.HELIUS_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "solis-batch",
        method: "getAssetBatch",
        params: { ids: uncached },
      }),
    });

    if (!res.ok) {
      console.warn("[HeliusMeta] Batch HTTP", res.status);
      return result;
    }

    const json = await res.json();
    const assets = json.result;

    if (Array.isArray(assets)) {
      for (const asset of assets) {
        if (!asset?.id) continue;
        const meta: TokenMetadata = {
          symbol: asset.content?.metadata?.symbol || "",
          name: asset.content?.metadata?.name || "",
          logoURI:
            asset.content?.links?.image ||
            asset.content?.files?.[0]?.uri ||
            null,
          decimals: asset.token_info?.decimals ?? 0,
        };
        cache[asset.id] = meta;
        result[asset.id] = meta;
      }
    }

    console.log(`[HeliusMeta] OK — ${Object.keys(result).length}/${ids.length} entries`);
  } catch (err) {
    console.warn("[HeliusMeta] Batch failed:", err);
  }

  return result;
}

/**
 * Fetch metadata for a single token.
 */
export async function getTokenMetadata(
  mint: string
): Promise<TokenMetadata | null> {
  if (cache[mint]) return cache[mint];

  try {
    const res = await fetch(SOLIS_CONFIG.HELIUS_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "solis-single",
        method: "getAsset",
        params: { id: mint },
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const asset = json.result;
    if (!asset) return null;

    const meta: TokenMetadata = {
      symbol: asset.content?.metadata?.symbol || "",
      name: asset.content?.metadata?.name || "",
      logoURI:
        asset.content?.links?.image ||
        asset.content?.files?.[0]?.uri ||
        null,
      decimals: asset.token_info?.decimals ?? 0,
    };

    cache[asset.id || mint] = meta;
    return meta;
  } catch {
    return null;
  }
}

/**
 * Get cached logo URI (call getAllTokenMetadata first).
 */
export function getCachedLogoURI(mint: string): string | null {
  return cache[mint]?.logoURI ?? null;
}
