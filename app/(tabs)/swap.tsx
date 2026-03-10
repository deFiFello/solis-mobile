// ═══════════════════════════════════════════════════════════
// SWAP SCREEN V3 — Polished UX
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, Pressable, TextInput, ScrollView,
  ActivityIndicator, Modal, FlatList, Linking, Alert,
  KeyboardAvoidingView, Platform, Keyboard, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { useWallet } from "../../contexts/WalletProvider";
import { useSeeker } from "../../contexts/SeekerProvider";
import { SOLIS_ASSETS } from "../../services/config";
type SolisAsset = (typeof SOLIS_ASSETS)[number];
import TokenLogo from "../../components/TokenLogo";
import { VersionedTransaction } from "@solana/web3.js";
import { getQuote, getSwapTransaction, confirmTransaction, toBaseUnits, fromBaseUnits, type JupiterQuote } from "../../lib/jupiterSwap";

const C = { bg: "#000000", surface: "#1A1A1A", border: "#2D2D2D", green: "#BDFF00", red: "#FF4444", white: "#FFFFFF", muted: "rgba(255,255,255,0.4)", dimmed: "rgba(255,255,255,0.25)", subtle: "rgba(255,255,255,0.15)", purple: "#A855F7", purpleDim: "rgba(168,85,247,0.10)", purpleBorder: "rgba(168,85,247,0.25)" };

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function encodeBase58(bytes: Uint8Array): string { if (bytes.length === 0) return ""; let zeros = 0; while (zeros < bytes.length && bytes[zeros] === 0) zeros++; let num = BigInt(0); for (let i = 0; i < bytes.length; i++) num = num * BigInt(256) + BigInt(bytes[i]); let encoded = ""; while (num > BigInt(0)) { encoded = B58[Number(num % BigInt(58))] + encoded; num = num / BigInt(58); } return "1".repeat(zeros) + encoded; }
function fmtAmount(n: number, decimals: number = 6): string { if (n === 0) return "0"; if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 4 }); if (n >= 1) return n.toFixed(4); if (n >= 0.0001) return n.toFixed(6); return n.toFixed(decimals); }

const defaultFrom: SolisAsset = SOLIS_ASSETS.find((a) => a.symbol === "SOL")!;
const defaultTo: SolisAsset = SOLIS_ASSETS.find((a) => a.symbol === "USDC")!;
type SwapMode = "swap" | "shadow";

function useFlash() { const opacity = useRef(new Animated.Value(0)).current; const flash = useCallback(() => { opacity.setValue(0.12); Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(); }, []); return { opacity, flash }; }

// ═══════════════════════════════════════════════════════════
// SHADOW COMING SOON
// ═══════════════════════════════════════════════════════════
function ShadowComingSoon() { const insets = useSafeAreaInsets(); return (<ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}><View style={sh.hero}><View style={sh.pcLogo}><Text style={sh.pcLogoText}>PC</Text></View><Text style={sh.heroTitle}>Shadow Swaps</Text><View style={sh.comingBadge}><Text style={sh.comingText}>COMING TO MOBILE</Text></View><Text style={sh.heroSub}>Private trading powered by zero-knowledge proofs. Break the on-chain link between your wallet and your trades.</Text></View><View style={sh.section}><Text style={sh.sectionTitle}>WHAT ARE SHADOW SWAPS</Text><Text style={sh.body}>Every swap on Solana is public. Your wallet, the tokens you trade, the amounts — all visible on-chain. Shadow Swaps change that.</Text><Text style={[sh.body, { marginTop: 10 }]}>When you shadow a swap, output tokens deposit into a PrivacyCash privacy pool using a groth16 zero-knowledge proof. This cryptographically breaks the link between your deposit and any future withdrawal.</Text></View><View style={sh.section}><Text style={sh.sectionTitle}>HOW IT WORKS</Text><View style={sh.step}><View style={sh.stepDot}><Text style={sh.stepNum}>1</Text></View><View style={sh.stepBody}><Text style={sh.stepTitle}>You swap normally</Text><Text style={sh.stepDesc}>Jupiter routes your trade across Solana liquidity. Same speed, same prices.</Text></View></View><View style={sh.stepLine} /><View style={sh.step}><View style={sh.stepDot}><Text style={sh.stepNum}>2</Text></View><View style={sh.stepBody}><Text style={sh.stepTitle}>Output auto-shields</Text><Text style={sh.stepDesc}>Swap output deposits into a ZK privacy pool. A WASM circuit generates a groth16 proof locally.</Text></View></View><View style={sh.stepLine} /><View style={sh.step}><View style={sh.stepDot}><Text style={sh.stepNum}>3</Text></View><View style={sh.stepBody}><Text style={sh.stepTitle}>Withdraw anywhere</Text><Text style={sh.stepDesc}>Withdraw shielded balance to any wallet. ZK proof ensures no observer can link withdrawal to your swap.</Text></View></View></View><View style={sh.section}><Text style={sh.sectionTitle}>PROTOCOL DETAILS</Text><View style={sh.techCard}><ShRow l="Proof system" v="groth16 (Bn254)" /><ShRow l="Circuit" v="WASM + zkey (20MB)" /><ShRow l="Proof generation" v="Client-side only" /><ShRow l="Privacy protocol" v="PrivacyCash v1.1" /><ShRow l="Audits" v="14 (Veridise verified)" last /></View></View><View style={sh.section}><Text style={sh.sectionTitle}>FEE STRUCTURE</Text><View style={sh.techCard}><ShRow l="Shadow swap" v="0.75%" purple /><ShRow l="Standard swap" v="0.50%" /><ShRow l="Privacy premium" v="+0.25%" /><ShRow l="Withdraw" v="0.35% + rent" last /></View></View><View style={sh.badgeRow}>{["groth16","WASM","ZK-SNARK","PrivacyCash"].map(t=>(<View key={t} style={sh.badge}><Text style={sh.badgeText}>{t}</Text></View>))}</View></ScrollView>); }
function ShRow({l,v,purple,last}:{l:string;v:string;purple?:boolean;last?:boolean}){return(<>{<View style={sh.techRow}><Text style={sh.techLabel}>{l}</Text><Text style={purple?sh.techValuePurple:sh.techValue}>{v}</Text></View>}{!last&&<View style={sh.techDivider}/>}</>);}
const sh = StyleSheet.create({ hero:{alignItems:"center",paddingTop:28,paddingBottom:24,gap:6}, pcLogo:{width:48,height:48,backgroundColor:C.purpleDim,borderWidth:1,borderColor:C.purpleBorder,alignItems:"center",justifyContent:"center",marginBottom:8}, pcLogoText:{fontFamily:"InterBold",fontSize:16,color:C.purple,letterSpacing:1}, heroTitle:{fontFamily:"InterBold",fontSize:26,color:C.white,letterSpacing:0.5}, comingBadge:{backgroundColor:C.purpleDim,borderWidth:1,borderColor:C.purpleBorder,paddingHorizontal:14,paddingVertical:5,marginTop:4}, comingText:{fontFamily:"InterSemiBold",fontSize:10,color:C.purple,letterSpacing:2}, heroSub:{fontFamily:"Inter",fontSize:14,color:C.muted,textAlign:"center",lineHeight:22,marginTop:8,paddingHorizontal:8}, section:{marginTop:28}, sectionTitle:{fontFamily:"InterSemiBold",fontSize:10,color:C.dimmed,letterSpacing:2,marginBottom:12}, body:{fontFamily:"Inter",fontSize:14,color:"rgba(255,255,255,0.55)",lineHeight:22}, step:{flexDirection:"row",gap:14,alignItems:"flex-start"}, stepDot:{width:30,height:30,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:C.purpleBorder,backgroundColor:C.purpleDim}, stepNum:{fontFamily:"InterBold",fontSize:13,color:C.purple}, stepBody:{flex:1,paddingTop:3}, stepTitle:{fontFamily:"InterSemiBold",fontSize:15,color:C.white}, stepDesc:{fontFamily:"Inter",fontSize:12,color:C.muted,lineHeight:19,marginTop:3}, stepLine:{width:1,height:16,backgroundColor:C.purpleBorder,marginLeft:14,marginVertical:2}, techCard:{backgroundColor:C.surface,borderWidth:1,borderColor:C.border,padding:16}, techRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:9}, techDivider:{height:1,backgroundColor:C.border}, techLabel:{fontFamily:"Inter",fontSize:13,color:C.muted}, techValue:{fontFamily:"InterSemiBold",fontSize:13,color:"rgba(255,255,255,0.7)",fontVariant:["tabular-nums"]}, techValuePurple:{fontFamily:"InterBold",fontSize:13,color:C.purple,fontVariant:["tabular-nums"]}, badgeRow:{flexDirection:"row",justifyContent:"center",flexWrap:"wrap",gap:8,marginTop:28,marginBottom:20}, badge:{backgroundColor:C.purpleDim,borderWidth:1,borderColor:C.purpleBorder,paddingHorizontal:12,paddingVertical:5}, badgeText:{fontFamily:"InterSemiBold",fontSize:9,color:C.purple,letterSpacing:1.2} });

// ═══════════════════════════════════════════════════════════
// MAIN SWAP SCREEN
// ═══════════════════════════════════════════════════════════
export default function SwapScreen() {
  const insets = useSafeAreaInsets();
  const { isConnected, isConnecting, connect, address, publicKey, balances, refreshBalances } = useWallet();
  const { feeTier, seekerMode } = useSeeker();
  const [mode, setMode] = useState<SwapMode>("swap");
  const [fromToken, setFromToken] = useState<SolisAsset>(defaultFrom);
  const [toToken, setToToken] = useState<SolisAsset>(defaultTo);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txConfirmed, setTxConfirmed] = useState(false);
  const [selectorTarget, setSelectorTarget] = useState<"from"|"to"|null>(null);
  const [activePct, setActivePct] = useState<number|null>(null);
  const quoteTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const { opacity: quoteFlash, flash: triggerFlash } = useFlash();

  const fetchQuote = useCallback(async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0 || fromToken.mint === toToken.mint) { setQuote(null); setQuoteError(null); return; }
    setQuoteLoading(true); setQuoteError(null);
    try { const q = await getQuote(fromToken.mint, toToken.mint, toBaseUnits(n, fromToken.decimals), feeTier?.feeBps ?? 50); setQuote(q); triggerFlash(); }
    catch (err: any) { setQuoteError(err?.message?.includes("No route") || err?.message?.includes("ROUTE") ? "No route found" : "Failed to get quote"); setQuote(null); }
    finally { setQuoteLoading(false); }
  }, [amount, fromToken, toToken, feeTier]);

  useEffect(() => { if (quoteTimer.current) clearTimeout(quoteTimer.current); const n = parseFloat(amount); if (!n || n <= 0) { setQuote(null); return; } quoteTimer.current = setTimeout(fetchQuote, 600); return () => { if (quoteTimer.current) clearTimeout(quoteTimer.current); }; }, [amount, fromToken, toToken, fetchQuote]);

  const reverseTokens = () => { setFromToken(toToken); setToToken(fromToken); setAmount(""); setQuote(null); setTxSignature(null); setActivePct(null); };
  const setPercentage = (pct: number) => { const bal = balances[fromToken.symbol] || 0; if (bal <= 0) return; let use = bal * (pct / 100); if (fromToken.symbol === "SOL" && pct === 100) use = Math.max(0, bal - 0.01); setAmount(use > 0 ? fmtAmount(use, fromToken.decimals) : ""); setActivePct(pct); };
  const handleAmountChange = (t: string) => { const c = t.replace(/[^0-9.]/g, ""); if (c.split(".").length > 2) return; setAmount(c); setTxSignature(null); setActivePct(null); };

  const executeSwap = async () => {
    if (!quote || !publicKey || !address) return;
    setSwapping(true); setTxSignature(null); setTxConfirmed(false); Keyboard.dismiss();
    try {
      const tx = VersionedTransaction.deserialize(await getSwapTransaction(quote, address));
      const result = await transact(async (wallet) => { await wallet.authorize({ cluster: "mainnet-beta", identity: { name: "Solis", uri: "https://solis-tokenized-markets.vercel.app", icon: "/icon.png" } }); return await wallet.signAndSendTransactions({ transactions: [tx] }); });
      let sig: string;
      if (Array.isArray(result) && result.length > 0) { const first = result[0]; sig = typeof first === "string" ? first : encodeBase58(new Uint8Array(first)); }
      else { throw new Error("No signature returned"); }
      console.log(`[Swap] TX: ${sig}`);
      setTxSignature(sig);
      const confirmed = await confirmTransaction(sig);
      setTxConfirmed(confirmed);
      if (confirmed) setTimeout(() => refreshBalances(), 2000);
    } catch (err: any) {
      const msg = err?.message || "Swap failed";
      if (msg.includes("rejected") || msg.includes("declined")) Alert.alert("Cancelled", "Transaction was cancelled.");
      else if (msg.includes("transact") || msg.includes("No installed")) Alert.alert("Wallet Required", "Open Phantom or Seed Vault first.");
      else Alert.alert("Swap Failed", msg);
    } finally { setSwapping(false); }
  };

  const fromBalance = balances[fromToken.symbol] || 0;
  const toBalance = balances[toToken.symbol] || 0;
  const numAmount = parseFloat(amount) || 0;
  const outAmount = quote ? fromBaseUnits(quote.outAmount, toToken.decimals) : 0;
  const priceImpact = quote ? parseFloat(quote.priceImpactPct) : 0;
  const rate = numAmount > 0 && outAmount > 0 ? outAmount / numAmount : 0;
  const insufficientBalance = numAmount > 0 && numAmount > fromBalance && isConnected;
  const canSwap = isConnected && numAmount > 0 && quote && !quoteLoading && !swapping && !insufficientBalance;
  const hasEnteredAmount = numAmount > 0;

  if (mode === "shadow") { return (<View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}><View style={st.toggleWrap}><Pressable style={st.toggleTab} onPress={() => setMode("swap")}><Text style={st.toggleLabel}>SWAP</Text></Pressable><Pressable style={[st.toggleTab, st.togglePurpleActive]}><Text style={[st.toggleLabel, { color: C.purple }]}>SHADOW</Text></Pressable></View><ShadowComingSoon /></View>); }

  return (
    <KeyboardAvoidingView style={[st.container, { paddingTop: insets.top + 12 }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={st.toggleWrap}>
          <Pressable style={[st.toggleTab, st.toggleGreenActive]}><Text style={[st.toggleLabel, { color: C.green }]}>SWAP</Text></Pressable>
          <Pressable style={st.toggleTab} onPress={() => setMode("shadow")}><Text style={st.toggleLabel}>SHADOW</Text></Pressable>
        </View>

        {/* FROM + Reverse + TO as one unit */}
        <View style={st.swapUnit}>
          <View style={st.cardInner}>
            <View style={st.cardHeader}>
              <Text style={st.cardLabel}>FROM</Text>
              <Pressable onPress={() => isConnected && fromBalance > 0 && setPercentage(100)} hitSlop={8}>
                <Text style={[st.balanceText, isConnected && fromBalance > 0 && { color: C.green }]}>{isConnected ? (fromBalance > 0 ? fmtAmount(fromBalance) : "0") : "--"}</Text>
              </Pressable>
            </View>
            <View style={st.inputRow}>
              <TextInput style={st.amountInput} value={amount} onChangeText={handleAmountChange} placeholder="0" placeholderTextColor={C.dimmed} keyboardType="decimal-pad" returnKeyType="done" />
              <Pressable style={st.tokenBtn} onPress={() => setSelectorTarget("from")}><TokenLogo symbol={fromToken.symbol} size={26} /><Text style={st.tokenBtnText}>{fromToken.symbol}</Text><Text style={st.chevron}>▾</Text></Pressable>
            </View>
            <View style={st.pctRow}>{[25,50,75,100].map(p => { const dis = !isConnected || fromBalance <= 0; const act = activePct === p && !dis; return (<Pressable key={p} style={[st.pctBtn, dis && st.pctBtnDisabled, act && st.pctBtnActive]} onPress={() => !dis && setPercentage(p)} disabled={dis}><Text style={[st.pctText, dis && {opacity:0.3}, act && {color:C.green}]}>{p===100?"MAX":`${p}%`}</Text></Pressable>); })}</View>
            {insufficientBalance && <Text style={st.errorText}>Insufficient {fromToken.symbol} balance</Text>}
          </View>
          <View style={st.reverseLine}><View style={st.reverseDivider}/><Pressable style={st.reverseBtn} onPress={reverseTokens} hitSlop={{top:8,bottom:8,left:8,right:8}}><Text style={st.reverseIcon}>↕</Text></Pressable><View style={st.reverseDivider}/></View>
          <View style={st.cardInner}>
            <View style={st.cardHeader}><Text style={st.cardLabel}>TO</Text><Text style={st.balanceText}>{isConnected && toBalance > 0 ? fmtAmount(toBalance) : "--"}</Text></View>
            <View style={st.inputRow}>
              <Text style={[st.outputAmount, !outAmount && { color: C.dimmed }]}>{quoteLoading ? "..." : outAmount > 0 ? fmtAmount(outAmount, toToken.decimals) : "0"}</Text>
              <Pressable style={st.tokenBtn} onPress={() => setSelectorTarget("to")}><TokenLogo symbol={toToken.symbol} size={26} /><Text style={st.tokenBtnText}>{toToken.symbol}</Text><Text style={st.chevron}>▾</Text></Pressable>
            </View>
          </View>
        </View>

        {/* Quote with flash */}
        {quote && !quoteLoading && (<View style={st.quoteCard}><Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.green, opacity: quoteFlash }]} /><QRow label="Rate" value={`1 ${fromToken.symbol} = ${fmtAmount(rate)} ${toToken.symbol}`} /><QRow label="Price Impact" value={`${priceImpact.toFixed(3)}%`} color={priceImpact > 1 ? C.red : priceImpact > 0.3 ? "#FFA500" : C.green} /><QRow label="Platform Fee" value={quote._feeBps > 0 ? `${(quote._feeBps / 100).toFixed(2)}%` : "No fee"} color={quote._feeBps > 0 ? C.white : C.dimmed} />{quote.routePlan.length > 0 && <QRow label="Route" value={quote.routePlan.map(r => r.swapInfo.label).filter(Boolean).join(" > ") || "Direct"} />}<QRow label="Min Received" value={`${fmtAmount(fromBaseUnits(quote.otherAmountThreshold, toToken.decimals))} ${toToken.symbol}`} /><QRow label="Slippage" value="0.5% auto" last /></View>)}

        {/* Context when empty */}
        {!quote && !quoteLoading && !quoteError && !hasEnteredAmount && !txSignature && (<View style={st.contextCard}><View style={st.contextRow}><Text style={st.contextTitle}>Swap any of 22 assets</Text><Text style={st.contextSub}>Jupiter routes across Solana DEXs for best execution</Text></View><View style={st.contextDivider} /><View style={st.contextRow}><Text style={st.contextTitle}>{seekerMode ? "Seeker verified rate" : "Platform fee: 0.50%"}</Text><Text style={st.contextSub}>{seekerMode ? "0.35% fee — first $5K fee-free" : "Seeker holders get first $5K fee-free"}</Text></View><View style={st.contextDivider} /><View style={st.contextRow}><Text style={st.contextTitle}>Priority execution</Text><Text style={st.contextSub}>Transactions include priority fees for reliable landing</Text></View></View>)}

        {quoteError && <View style={st.errorCard}><Text style={st.errorCardText}>{quoteError}</Text></View>}

        {/* CTA */}
        {!isConnected ? (
          <Pressable style={({pressed}) => [st.ctaBtn, pressed && st.ctaPressed]} onPress={connect} disabled={isConnecting}>{isConnecting ? <ActivityIndicator color="#000" /> : <Text style={st.ctaText}>Connect Wallet</Text>}</Pressable>
        ) : (
          <Pressable style={({pressed}) => [st.ctaBtn, !canSwap && st.ctaDisabled, pressed && canSwap && st.ctaPressed]} onPress={canSwap ? executeSwap : undefined} disabled={!canSwap}>
            {swapping ? (<View style={{flexDirection:"row",alignItems:"center"}}><ActivityIndicator color="#000" size="small" /><Text style={[st.ctaText,{marginLeft:8}]}>Swapping...</Text></View>) : (
              <Text style={[st.ctaText, !canSwap && {opacity:0.5}]}>{insufficientBalance ? `Insufficient ${fromToken.symbol}` : numAmount <= 0 ? "Enter Amount" : quoteLoading ? "Getting Quote..." : `Swap ${fromToken.symbol} to ${toToken.symbol}`}</Text>
            )}
          </Pressable>
        )}

        {/* Success */}
        {txSignature && (<View style={st.successCard}><Text style={st.successTitle}>{txConfirmed ? "Swap Confirmed" : "Confirming..."}</Text><Text style={st.successAmount}>{fmtAmount(numAmount)} {fromToken.symbol} to {fmtAmount(outAmount)} {toToken.symbol}</Text><Pressable style={st.solscanBtn} onPress={() => Linking.openURL(`https://solscan.io/tx/${txSignature}`)}><Text style={st.solscanText}>View on Solscan</Text></Pressable></View>)}

        {/* Shadow CTA */}
        <Pressable style={st.shadowCta} onPress={() => setMode("shadow")}><View style={st.pcMark}><Text style={st.pcMarkText}>PC</Text></View><View style={{flex:1}}><Text style={st.shadowCtaTitle}>Shadow Swaps</Text><Text style={st.shadowCtaSub}>ZK-private trading via PrivacyCash</Text></View></Pressable>

        {seekerMode && (<View style={st.tierCard}><View style={st.tierDot}/><View style={{flex:1}}><Text style={st.tierLabel}>Seeker Verified</Text><Text style={st.tierDetail}>{feeTier.feePercent} swap fee — first $5K fee-free</Text></View></View>)}
        <View style={{ height: 40 }} />
      </ScrollView>

      <TokenSelectorModal visible={selectorTarget !== null} onClose={() => setSelectorTarget(null)} onSelect={(asset) => { if (selectorTarget === "from") { if (asset.mint === toToken.mint) setToToken(fromToken); setFromToken(asset); } else { if (asset.mint === fromToken.mint) setFromToken(toToken); setToToken(asset); } setAmount(""); setQuote(null); setTxSignature(null); setSelectorTarget(null); setActivePct(null); }} currentMint={selectorTarget === "from" ? fromToken.mint : toToken.mint} balances={balances} />
    </KeyboardAvoidingView>
  );
}

function QRow({ label, value, color, last }: { label: string; value: string; color?: string; last?: boolean }) { return (<View style={[st.quoteRow, last && {borderBottomWidth:0,paddingBottom:0}]}><Text style={st.quoteLabel}>{label}</Text><Text style={[st.quoteValue, color ? {color} : undefined]} numberOfLines={1}>{value}</Text></View>); }

function TokenSelectorModal({ visible, onClose, onSelect, currentMint, balances }: { visible: boolean; onClose: () => void; onSelect: (a: SolisAsset) => void; currentMint: string; balances: Record<string, number>; }) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const filtered = SOLIS_ASSETS.filter(a => { if (!search) return true; const q = search.toLowerCase(); return a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q); });
  const sorted = [...filtered].sort((a, b) => { const bA = balances[a.symbol]||0; const bB = balances[b.symbol]||0; if (bA > 0 && bB <= 0) return -1; if (bB > 0 && bA <= 0) return 1; return a.symbol.localeCompare(b.symbol); });
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[st.modalOverlay, { paddingTop: insets.top }]}>
        <Pressable style={st.modalBackdrop} onPress={onClose} />
        <View style={[st.modalContent, { paddingBottom: insets.bottom + 20 }]}>
          <View style={st.modalHeader}><Text style={st.modalTitle}>Select Token</Text><Pressable onPress={onClose} hitSlop={12}><Text style={st.modalClose}>✕</Text></Pressable></View>
          <TextInput style={st.searchInput} placeholder="Search by name or symbol..." placeholderTextColor={C.dimmed} value={search} onChangeText={setSearch} autoCapitalize="none" />
          <FlatList data={sorted} keyExtractor={i => i.mint} showsVerticalScrollIndicator={false} renderItem={({ item }) => { const cur = item.mint === currentMint; const bal = balances[item.symbol]||0; return (<Pressable style={[st.selectorRow, cur && st.selectorRowActive]} onPress={() => !cur && onSelect(item)} disabled={cur} android_ripple={{color:"rgba(189,255,0,0.06)"}}><TokenLogo symbol={item.symbol} size={36}/><View style={st.selectorInfo}><Text style={[st.selectorSymbol, cur && {color:C.green}]}>{item.symbol}</Text><Text style={st.selectorName} numberOfLines={1}>{item.name}</Text></View>{bal > 0 && <Text style={st.selectorBalance}>{fmtAmount(bal)}</Text>}{cur && <Text style={{color:C.green,fontSize:12,fontFamily:"InterSemiBold"}}>Selected</Text>}</Pressable>); }} />
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },
  toggleWrap: { flexDirection: "row", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  toggleTab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  toggleGreenActive: { backgroundColor: "rgba(189,255,0,0.08)", borderBottomWidth: 2, borderBottomColor: C.green },
  togglePurpleActive: { backgroundColor: C.purpleDim, borderBottomWidth: 2, borderBottomColor: C.purple },
  toggleLabel: { fontFamily: "InterSemiBold", fontSize: 12, color: C.muted, letterSpacing: 1.5 },
  swapUnit: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  cardInner: { padding: 16 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardLabel: { fontFamily: "InterSemiBold", fontSize: 10, color: C.muted, letterSpacing: 1.5 },
  balanceText: { fontFamily: "Inter", fontSize: 11, color: C.muted, fontVariant: ["tabular-nums"] },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  amountInput: { flex: 1, fontFamily: "InterBold", fontSize: 32, color: C.white, fontVariant: ["tabular-nums"], padding: 0, minHeight: 42 },
  outputAmount: { flex: 1, fontFamily: "InterBold", fontSize: 32, color: C.white, fontVariant: ["tabular-nums"] },
  tokenBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10, minHeight: 44 },
  tokenBtnText: { fontFamily: "InterBold", fontSize: 15, color: C.white },
  chevron: { color: C.muted, fontSize: 12 },
  pctRow: { flexDirection: "row", gap: 6, marginTop: 12 },
  pctBtn: { flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, paddingVertical: 8, alignItems: "center" },
  pctBtnDisabled: { borderColor: "rgba(45,45,45,0.4)" },
  pctBtnActive: { borderColor: C.green, backgroundColor: "rgba(189,255,0,0.06)" },
  pctText: { fontFamily: "InterSemiBold", fontSize: 11, color: C.muted },
  reverseLine: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  reverseDivider: { flex: 1, height: 1, backgroundColor: C.border },
  reverseBtn: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, width: 44, height: 44, alignItems: "center", justifyContent: "center", marginHorizontal: 12 },
  reverseIcon: { color: C.muted, fontSize: 20 },
  quoteCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 14, marginTop: 12, overflow: "hidden" },
  quoteRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.border },
  quoteLabel: { fontFamily: "Inter", fontSize: 12, color: C.muted },
  quoteValue: { fontFamily: "InterSemiBold", fontSize: 12, color: C.white, fontVariant: ["tabular-nums"], maxWidth: "60%", textAlign: "right" },
  contextCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 12 },
  contextRow: { paddingVertical: 10 },
  contextDivider: { height: 1, backgroundColor: C.border },
  contextTitle: { fontFamily: "InterSemiBold", fontSize: 13, color: C.white },
  contextSub: { fontFamily: "Inter", fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 16 },
  errorText: { fontFamily: "Inter", fontSize: 11, color: C.red, marginTop: 8 },
  errorCard: { backgroundColor: "rgba(255,68,68,0.08)", borderWidth: 1, borderColor: "rgba(255,68,68,0.2)", padding: 12, marginTop: 12, alignItems: "center" },
  errorCardText: { fontFamily: "Inter", fontSize: 12, color: C.red },
  ctaBtn: { backgroundColor: C.green, paddingVertical: 16, alignItems: "center", marginTop: 16 },
  ctaDisabled: { backgroundColor: "rgba(189,255,0,0.3)" },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  ctaText: { fontFamily: "InterBold", fontSize: 15, color: "#000", letterSpacing: 0.3 },
  successCard: { backgroundColor: "rgba(189,255,0,0.06)", borderWidth: 1, borderColor: "rgba(189,255,0,0.2)", padding: 16, marginTop: 12, alignItems: "center", gap: 8 },
  successTitle: { fontFamily: "InterBold", fontSize: 14, color: C.green },
  successAmount: { fontFamily: "Inter", fontSize: 13, color: C.white, fontVariant: ["tabular-nums"] },
  solscanBtn: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 8, marginTop: 4 },
  solscanText: { fontFamily: "InterSemiBold", fontSize: 12, color: C.green },
  shadowCta: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.purpleDim, borderWidth: 1, borderColor: C.purpleBorder, padding: 14, marginTop: 16 },
  pcMark: { width: 32, height: 32, backgroundColor: "rgba(168,85,247,0.15)", borderWidth: 1, borderColor: C.purpleBorder, alignItems: "center", justifyContent: "center" },
  pcMarkText: { fontFamily: "InterBold", fontSize: 11, color: C.purple, letterSpacing: 0.5 },
  shadowCtaTitle: { fontFamily: "InterSemiBold", fontSize: 13, color: C.purple },
  shadowCtaSub: { fontFamily: "Inter", fontSize: 11, color: "rgba(168,85,247,0.6)", marginTop: 2 },
  tierCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(189,255,0,0.04)", borderWidth: 1, borderColor: "rgba(189,255,0,0.1)", padding: 12, marginTop: 12 },
  tierDot: { width: 8, height: 8, backgroundColor: C.green, borderRadius: 4 },
  tierLabel: { fontFamily: "InterSemiBold", fontSize: 12, color: C.green },
  tierDetail: { fontFamily: "Inter", fontSize: 10, color: C.muted, marginTop: 1 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)" },
  modalBackdrop: { height: 60 },
  modalContent: { flex: 1, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 16, paddingTop: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { fontFamily: "InterBold", fontSize: 18, color: C.white },
  modalClose: { fontSize: 20, color: C.muted, padding: 4 },
  searchInput: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter", fontSize: 14, color: C.white, marginBottom: 12 },
  selectorRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  selectorRowActive: { opacity: 0.5 },
  selectorInfo: { flex: 1 },
  selectorSymbol: { fontFamily: "InterBold", fontSize: 15, color: C.white },
  selectorName: { fontFamily: "Inter", fontSize: 11, color: C.muted, marginTop: 1 },
  selectorBalance: { fontFamily: "InterSemiBold", fontSize: 13, color: C.green, fontVariant: ["tabular-nums"] },
});
