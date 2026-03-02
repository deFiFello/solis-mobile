import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { PublicKey, Connection } from "@solana/web3.js";
import { useWallet } from "./WalletProvider";
import { SKR_MINT as SKR_MINT_STR, SGT_MINT_AUTHORITY as SGT_STR, RPC_ENDPOINTS } from "../services/config";export type FeeTier = "standard" | "seeker" | "seeker_plus" | "seeker_pro";

type FeeTierInfo = {
  tier: FeeTier;
  label: string;
  feeBps: number;    // platformFeeBps value for Jupiter
  feePercent: string; // display string
};

export const FEE_TIERS: Record<FeeTier, FeeTierInfo> = {
  standard:    { tier: "standard",    label: "Standard",    feeBps: 50, feePercent: "0.50%" },
  seeker:      { tier: "seeker",      label: "Seeker",      feeBps: 35, feePercent: "0.35%" },
  seeker_plus: { tier: "seeker_plus", label: "Seeker+",     feeBps: 25, feePercent: "0.25%" },
  seeker_pro:  { tier: "seeker_pro",  label: "Seeker Pro",  feeBps: 15, feePercent: "0.15%" },
};

type SeekerState = {
  hasGenesisToken: boolean;
  skrBalance: number;
  feeTier: FeeTierInfo;
  isChecking: boolean;
  seekerMode: boolean; // true if Genesis Token detected
  refresh: () => Promise<void>;
};

const SeekerContext = createContext<SeekerState>({
  hasGenesisToken: false,
  skrBalance: 0,
  feeTier: FEE_TIERS.standard,
  isChecking: false,
  seekerMode: false,
  refresh: async () => {},
});

export const useSeeker = () => useContext(SeekerContext);

// ─── Constants ─────────────────────────────────────────────

// Seeker Genesis Token — Token-2022 group member mint authority
const SGT_MINT_AUTHORITY = new PublicKey(
  "GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4"
);

// Token-2022 program
const TOKEN_2022_PROGRAM = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

const SKR_MINT = new PublicKey(SKR_MINT_STR);
const SKR_PLUS_THRESHOLD = 1000; // 1,000 SKR for Seeker+ tier

const connection = new Connection(RPC_ENDPOINTS.HELIUS);

// ─── Helpers ───────────────────────────────────────────────

/** Check if wallet holds a Seeker Genesis Token (Token-2022 NFT) */
async function checkGenesisToken(walletPubkey: PublicKey): Promise<boolean> {
  try {
    // Query all Token-2022 accounts owned by this wallet
    const response = await connection.getParsedTokenAccountsByOwner(
      walletPubkey,
      { programId: TOKEN_2022_PROGRAM }
    );

    // Check if any token account is from the Genesis Token collection
    for (const account of response.value) {
      const parsed = account.account.data.parsed;
      const info = parsed?.info;
      if (!info) continue;

      const amount = info.tokenAmount?.uiAmount || 0;
      if (amount <= 0) continue;

      // Check if this token's mint authority matches SGT
      // For Token-2022 NFTs, we check the mint info
      try {
        const mintPubkey = new PublicKey(info.mint);
        const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
        const mintData = (mintInfo.value?.data as any)?.parsed?.info;

        if (
          mintData?.mintAuthority === SGT_MINT_AUTHORITY.toBase58() ||
          mintData?.freezeAuthority === SGT_MINT_AUTHORITY.toBase58()
        ) {
          return true;
        }
      } catch {
        // Skip this mint if we can't read it
        continue;
      }
    }

    return false;
  } catch (err) {
    console.error("[Seeker] Genesis Token check error:", err);
    return false;
  }
}

/** Get SKR token balance for wallet */
async function getSKRBalance(walletPubkey: PublicKey): Promise<number> {
  try {
    const accounts = await connection.getParsedTokenAccountsByOwner(
      walletPubkey,
      { mint: SKR_MINT }
    );

    if (accounts.value.length === 0) return 0;

    const amount = accounts.value[0].account.data.parsed?.info?.tokenAmount?.uiAmount;
    return amount || 0;
  } catch (err) {
    console.error("[Seeker] SKR balance check error:", err);
    return 0;
  }
}

/** Calculate fee tier based on Genesis Token + SKR holdings */
function calculateFeeTier(hasGenesis: boolean, skrBalance: number): FeeTierInfo {
  if (!hasGenesis) return FEE_TIERS.standard;
  if (skrBalance >= SKR_PLUS_THRESHOLD) return FEE_TIERS.seeker_plus;
  return FEE_TIERS.seeker;
  // seeker_pro requires staked SKR — future implementation
}

// ─── Provider ──────────────────────────────────────────────
export function SeekerProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, isConnected } = useWallet();
  const [hasGenesisToken, setHasGenesisToken] = useState(false);
  const [skrBalance, setSKRBalance] = useState(0);
  const [feeTier, setFeeTier] = useState<FeeTierInfo>(FEE_TIERS.standard);
  const [isChecking, setIsChecking] = useState(false);

  const checkSeeker = useCallback(async () => {
    if (!publicKey) {
      setHasGenesisToken(false);
      setSKRBalance(0);
      setFeeTier(FEE_TIERS.standard);
      return;
    }

    setIsChecking(true);
    try {
      const [genesis, skr] = await Promise.all([
        checkGenesisToken(publicKey),
        getSKRBalance(publicKey),
      ]);

      setHasGenesisToken(genesis);
      setSKRBalance(skr);
      setFeeTier(calculateFeeTier(genesis, skr));
    } catch (err) {
      console.error("[Seeker] Check error:", err);
    } finally {
      setIsChecking(false);
    }
  }, [publicKey]);

  // Auto-check when wallet connects/disconnects
  useEffect(() => {
    if (isConnected && publicKey) {
      checkSeeker();
    } else {
      setHasGenesisToken(false);
      setSKRBalance(0);
      setFeeTier(FEE_TIERS.standard);
    }
  }, [isConnected, publicKey, checkSeeker]);

  return (
    <SeekerContext.Provider
      value={{
        hasGenesisToken,
        skrBalance,
        feeTier,
        isChecking,
        seekerMode: hasGenesisToken,
        refresh: checkSeeker,
      }}
    >
      {children}
    </SeekerContext.Provider>
  );
}
