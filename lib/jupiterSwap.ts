// ═══════════════════════════════════════════════════════════
// JUPITER SWAP SERVICE — Smart ATA Fee Routing
// ═══════════════════════════════════════════════════════════
// Same pattern as web codebase:
// 1. Check if fee wallet has ATA for output token
// 2. If yes → include platformFeeBps + feeAccount in swap
// 3. If no  → skip fees, swap still works
// Swaps NEVER break due to missing fee accounts.

import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Buffer } from "buffer";
import { SOLIS_CONFIG, RPC_ENDPOINTS } from "../services/config";

// ─── Config ────────────────────────────────────────────────
const JUPITER_SWAP_KEY = SOLIS_CONFIG.JUPITER_API_KEY;
const FEE_WALLET = SOLIS_CONFIG.FEE_WALLET;
// SOL native mint — can't collect platform fees on native SOL output
const SOL_MINT = "So11111111111111111111111111111111111111112";

const QUOTE_URL = SOLIS_CONFIG.JUPITER_QUOTE_API;
const SWAP_URL = "https://api.jup.ag/swap/v1/swap";

const connection = new Connection(RPC_ENDPOINTS.HELIUS, "confirmed");
const feeWalletPubkey = new PublicKey(FEE_WALLET);

// ─── ATA Cache ─────────────────────────────────────────────
// Cache which output mints have fee wallet ATAs so we don't
// hit RPC on every quote. Persists for app session.
const ataCache: Record<string, string | null> = {};
// null = checked, doesn't exist. string = ATA address.

// ─── Types ─────────────────────────────────────────────────
export interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  _raw?: any;
  // Smart fee routing result — tells swap builder whether to include fees
  _feeAta: string | null;
  _feeBps: number;
}

export interface SwapResult {
  signature: string;
  success: boolean;
}

// ─── Check Fee Wallet ATA ──────────────────────────────────
// Returns the ATA address if it exists, null if not.
// Results are cached per output mint for the session.
async function getFeeAta(outputMint: string): Promise<string | null> {
  // Skip SOL — can't collect platform fees on native token output
  if (outputMint === SOL_MINT) {
    console.log("[Fee] Skipping fee for native SOL output");
    return null;
  }

  // Check cache first
  if (outputMint in ataCache) {
    const cached = ataCache[outputMint];
    console.log(`[Fee] Cache ${cached ? "hit" : "miss (no ATA)"}: ${outputMint.slice(0, 8)}`);
    return cached;
  }

  try {
    const mint = new PublicKey(outputMint);
    const ata = await getAssociatedTokenAddress(mint, feeWalletPubkey);
    const account = await connection.getAccountInfo(ata);

    if (account) {
      const ataStr = ata.toBase58();
      ataCache[outputMint] = ataStr;
      console.log(`[Fee] ATA exists for ${outputMint.slice(0, 8)}: ${ataStr.slice(0, 8)}`);
      return ataStr;
    } else {
      ataCache[outputMint] = null;
      console.log(`[Fee] No ATA for ${outputMint.slice(0, 8)} — fees skipped`);
      return null;
    }
  } catch (err) {
    console.warn("[Fee] ATA check failed, skipping fees:", err);
    ataCache[outputMint] = null;
    return null;
  }
}

// ─── Get Quote ─────────────────────────────────────────────
export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  platformFeeBps: number = 50,
  slippageBps: number = 100,
): Promise<JupiterQuote> {
  // Check if fee collection is possible for this output token
  const feeAta = await getFeeAta(outputMint);
  const effectiveFeeBps = feeAta ? platformFeeBps : 0;

  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps: slippageBps.toString(),
  });

  // Only include platformFeeBps if we have a valid fee ATA
  if (effectiveFeeBps > 0) {
    params.set("platformFeeBps", effectiveFeeBps.toString());
  }

  console.log(`[Jupiter] Quote: ${inputMint.slice(0, 6)}→${outputMint.slice(0, 6)} amt=${amount} fee=${effectiveFeeBps}bps`);

  const res = await fetch(`${QUOTE_URL}?${params}`, {
    headers: { "x-api-key": JUPITER_SWAP_KEY },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[Jupiter] Quote error:", res.status, errText);
    throw new Error(`Jupiter quote failed: ${res.status} ${errText}`);
  }

  const data = await res.json();

  return {
    inputMint: data.inputMint,
    outputMint: data.outputMint,
    inAmount: data.inAmount,
    outAmount: data.outAmount,
    priceImpactPct: data.priceImpactPct || "0",
    routePlan: data.routePlan || [],
    otherAmountThreshold: data.otherAmountThreshold,
    swapMode: data.swapMode,
    slippageBps: data.slippageBps,
    platformFee: data.platformFee,
    _raw: data,
    _feeAta: feeAta,
    _feeBps: effectiveFeeBps,
  };
}

// ─── Get Swap Transaction ──────────────────────────────────
export async function getSwapTransaction(
  quoteResponse: JupiterQuote,
  userPublicKey: string,
): Promise<Uint8Array> {
  console.log(`[Jupiter] Building swap tx (fee: ${quoteResponse._feeBps}bps, ata: ${quoteResponse._feeAta ? "yes" : "no"})...`);

  const body: Record<string, any> = {
    quoteResponse: quoteResponse._raw,
    userPublicKey,
    wrapAndUnwrapSol: true,
    prioritizationFeeLamports: 500000,
    dynamicComputeUnitLimit: true,
  };

  // Only include feeAccount if we confirmed the ATA exists
  if (quoteResponse._feeAta && quoteResponse._feeBps > 0) {
    body.feeAccount = quoteResponse._feeAta;
    console.log(`[Jupiter] Fee collection ON: ${quoteResponse._feeBps}bps → ${quoteResponse._feeAta.slice(0, 8)}`);
  } else {
    console.log("[Jupiter] Fee collection OFF — no ATA for output token");
  }

  const res = await fetch(SWAP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": JUPITER_SWAP_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[Jupiter] Swap build error:", res.status, errText);
    throw new Error(`Jupiter swap failed: ${res.status} ${errText}`);
  }

  const data = await res.json();

  if (!data.swapTransaction) {
    throw new Error("No swapTransaction in Jupiter response");
  }

  const txBuffer = Buffer.from(data.swapTransaction, "base64");
  console.log(`[Jupiter] Transaction built: ${txBuffer.length} bytes`);

  return new Uint8Array(txBuffer);
}

// ─── Confirm Transaction ───────────────────────────────────
export async function confirmTransaction(
  signature: string,
): Promise<boolean> {
  try {
    const result = await connection.confirmTransaction(signature, "confirmed");
    if (result.value.err) {
      console.error("[Jupiter] TX confirmed with error:", result.value.err);
      return false;
    }
    console.log(`[Jupiter] TX confirmed: ${signature}`);
    return true;
  } catch (err) {
    console.error("[Jupiter] Confirmation timeout:", err);
    return false;
  }
}

// ─── Helpers ───────────────────────────────────────────────
export function toBaseUnits(amount: number, decimals: number): string {
  const factor = Math.pow(10, decimals);
  return Math.floor(amount * factor).toString();
}

export function fromBaseUnits(amount: string, decimals: number): number {
  return parseInt(amount, 10) / Math.pow(10, decimals);
}
