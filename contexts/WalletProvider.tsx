import React, { createContext, useContext, useState, useCallback } from "react";
import { Alert } from "react-native";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { Buffer } from "buffer";
import { RPC_ENDPOINTS, COMMON_MINTS, SOLIS_ASSETS } from "../services/config";
// ─── Types ─────────────────────────────────────────────────
type WalletState = {
  address: string | null;
  publicKey: PublicKey | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  balances: Record<string, number>; // symbol → UI amount
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalances: () => Promise<void>;
};

const WalletContext = createContext<WalletState>({
  address: null,
  publicKey: null,
  isConnecting: false,
  isConnected: false,
  error: null,
  balances: {},
  connect: async () => {},
  disconnect: () => {},
  refreshBalances: async () => {},
});

export const useWallet = () => useContext(WalletContext);

// ─── Helpers ───────────────────────────────────────────────

/** Decode Seed Vault base64-encoded address to base58 */
function decodeAddress(raw: string): string {
  // Seed Vault returns base64; detect by presence of base64 characters
  if (raw.includes("+") || raw.includes("/") || raw.includes("=")) {
    try {
      const bytes = Buffer.from(raw, "base64");
      return new PublicKey(bytes).toBase58();
    } catch {
      throw new Error(`Failed to decode base64 address: ${raw}`);
    }
  }
  return raw;
}

const connection = new Connection(RPC_ENDPOINTS.HELIUS);
// ─── Provider ──────────────────────────────────────────────
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, number>>({});

  const fetchBalances = useCallback(async (pubkey: PublicKey) => {
    try {
      const result: Record<string, number> = {};

      // SOL balance (native)
      const solBalance = await connection.getBalance(pubkey);
      result["SOL"] = solBalance / LAMPORTS_PER_SOL;

      // SPL token balances
      const splAssets = SOLIS_ASSETS.filter(
        (a) => a.mint !== COMMON_MINTS.SOL
      );

      const ataPromises = splAssets.map(async (asset) => {
        try {
          const mint = new PublicKey(asset.mint);
          const ata = await getAssociatedTokenAddress(mint, pubkey);
          const account = await getAccount(connection, ata);
          const amount = Number(account.amount) / Math.pow(10, asset.decimals);
          return { symbol: asset.symbol, amount };
        } catch {
          // Account doesn't exist = 0 balance
          return { symbol: asset.symbol, amount: 0 };
        }
      });

      const splResults = await Promise.all(ataPromises);
      for (const r of splResults) {
        result[r.symbol] = r.amount;
      }

      setBalances(result);
    } catch (err) {
      console.error("[Wallet] Balance fetch error:", err);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const authResult = await transact(async (wallet) => {
        return await wallet.authorize({
          cluster: "mainnet-beta",
          identity: {
            name: "Solis",
            uri: "https://solis-tokenized-markets.vercel.app",
            icon: "/icon.png",
          },
        });
      });

      if (!authResult.accounts || authResult.accounts.length === 0) {
        throw new Error("No accounts authorized");
      }

      const rawAddress = authResult.accounts[0].address;
      const decoded = decodeAddress(rawAddress as string);

      if (!decoded || decoded.trim() === "") {
        throw new Error("Invalid address format");
      }

      const pubkey = new PublicKey(decoded);
      setAddress(pubkey.toBase58());
      setPublicKey(pubkey);

      // Fetch balances after connection
      await fetchBalances(pubkey);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(msg);
      Alert.alert("Connection Error", msg);
    } finally {
      setIsConnecting(false);
    }
  }, [fetchBalances]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setPublicKey(null);
    setBalances({});
    setError(null);
  }, []);

  const refreshBalances = useCallback(async () => {
    if (publicKey) {
      await fetchBalances(publicKey);
    }
  }, [publicKey, fetchBalances]);

  return (
    <WalletContext.Provider
      value={{
        address,
        publicKey,
        isConnecting,
        isConnected: !!address,
        error,
        balances,
        connect,
        disconnect,
        refreshBalances,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
