import { View, Text, StyleSheet, Image } from "react-native";

const VERCEL_BASE = "https://solis-tokenized-markets.vercel.app/logos";

/**
 * Solis Logo System — matches Brand V2 web deployment
 * 
 * 16 SVG variants exist at public/logos/ on web:
 *   Core Symbol, Horizontal Lockup, Stacked Lockup, Wordmark
 *   Each in 4 colors: black, graphite, green (#BDFF00), white
 * 
 * For React Native we build the mark + wordmark natively (no SVG dep needed)
 * and reference partner logos from Vercel CDN.
 */

type LogoProps = {
  variant?: "mark" | "horizontal" | "wordmark";
  size?: number;
  color?: "green" | "white" | "graphite" | "black";
};

const COLORS = {
  green: "#BDFF00",
  white: "#FFFFFF",
  graphite: "#2D2D2D",
  black: "#000000",
};

/**
 * Primary Solis Logo — the green S square mark + SOLIS wordmark
 * Built natively to avoid SVG dependency issues on Seeker
 */
export default function SolisLogo({ variant = "horizontal", size = 24, color = "green" }: LogoProps) {
  const accentColor = COLORS[color];
  const textColor = color === "black" || color === "graphite" ? accentColor : accentColor;
  const markBg = accentColor;
  const markText = color === "green" ? "#000000" : color === "white" ? "#000000" : "#FFFFFF";

  if (variant === "mark") {
    return (
      <View style={[s.mark, { width: size, height: size, backgroundColor: markBg }]}>
        <Text style={[s.markText, { fontSize: size * 0.55, color: markText }]}>S</Text>
      </View>
    );
  }

  if (variant === "wordmark") {
    return (
      <Text style={[s.wordmark, { fontSize: size, color: textColor }]}>SOLIS</Text>
    );
  }

  // horizontal = mark + wordmark
  return (
    <View style={s.horizontal}>
      <View style={[s.mark, { width: size, height: size, backgroundColor: markBg }]}>
        <Text style={[s.markText, { fontSize: size * 0.55, color: markText }]}>S</Text>
      </View>
      <Text style={[s.wordmark, { fontSize: size * 0.83, color: textColor, marginLeft: size * 0.35 }]}>
        SOLIS
      </Text>
    </View>
  );
}

/**
 * Partner / infrastructure logos — loaded from Vercel deployment
 * These are the third-party logos in public/logos/ on web
 */
export const PARTNER_LOGOS = {
  jupiter: `${VERCEL_BASE}/jupiter-bright.svg`,
  jupiterDark: `${VERCEL_BASE}/jupiter.svg`,
  helius: `${VERCEL_BASE}/helius.svg`,
  privacycash: `${VERCEL_BASE}/privacycash.png`,
  solanaMobile: `${VERCEL_BASE}/solana-mobile.svg`,
  solana: `${VERCEL_BASE}/solana.svg`,
  kamino: `${VERCEL_BASE}/kamino.png`,
  meteora: `${VERCEL_BASE}/meteora.svg`,
  ondoIcon: `${VERCEL_BASE}/ondo-icon.png`,
  ondo: `${VERCEL_BASE}/ondo.png`,
  xstocks: `${VERCEL_BASE}/xstocks.svg`,
  solisToken: `${VERCEL_BASE}/solis-token.svg`,
};

/**
 * Partner logo image — use for PNG logos (kamino, privacycash, ondo)
 * SVGs won't render in React Native Image — use PNG variants or skip
 */
export function PartnerLogo({ name, size = 20 }: { name: keyof typeof PARTNER_LOGOS; size?: number }) {
  const uri = PARTNER_LOGOS[name];
  // Only render PNGs — SVGs need react-native-svg-transformer
  if (!uri.endsWith(".png")) return null;

  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

const s = StyleSheet.create({
  horizontal: { flexDirection: "row", alignItems: "center" },
  mark: { alignItems: "center", justifyContent: "center" },
  markText: { fontFamily: "InterBold" },
  wordmark: { fontFamily: "InterBold", letterSpacing: 3 },
});
