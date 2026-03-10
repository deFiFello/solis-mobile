import { View, Image, StyleSheet } from "react-native";

/**
 * Solis Logo System — Brand V2
 * Real PNG brand assets bundled in assets/logos/
 * Concentric ring symbol + SOLIS wordmark
 */

const LOGOS = {
  mark: {
    green: require("../assets/logos/solis-core-symbol.png"),
    white: require("../assets/logos/solis-core-symbol-w.png"),
    graphite: require("../assets/logos/solis-core-symbol-g.png"),
  },
  horizontal: {
    green: require("../assets/logos/solis-horizontal-lockup.png"),
    white: require("../assets/logos/solis-horizontal-lockup-w.png"),
    graphite: require("../assets/logos/solis-horizontal-lockup-g.png"),
  },
  stacked: {
    green: require("../assets/logos/solis-stacked-lockup.png"),
    white: require("../assets/logos/solis-stacked-lockup-w.png"),
    graphite: require("../assets/logos/solis-stacked-lockup-g.png"),
  },
  wordmark: {
    green: require("../assets/logos/solis-wordmark-green.png"),
    white: require("../assets/logos/solis-wordmark-white.png"),
    graphite: require("../assets/logos/solis-wordmark-graphite.png"),
  },
} as const;

type LogoProps = {
  variant?: "mark" | "horizontal" | "stacked" | "wordmark";
  size?: number;
  color?: "green" | "white" | "graphite";
};

export default function SolisLogo({ variant = "horizontal", size = 24, color = "green" }: LogoProps) {
  const source = LOGOS[variant]?.[color] ?? LOGOS.mark.green;

  if (variant === "horizontal") {
    return <Image source={source} style={{ width: size * 4.2, height: size }} resizeMode="contain" />;
  }
  if (variant === "wordmark") {
    return <Image source={source} style={{ width: size * 4.5, height: size }} resizeMode="contain" />;
  }
  if (variant === "stacked") {
    return <Image source={source} style={{ width: size, height: size * 1.3 }} resizeMode="contain" />;
  }
  return <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />;
}

const VERCEL_BASE = "https://solis-tokenized-markets.vercel.app/logos";

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

export function PartnerLogo({ name, size = 20 }: { name: keyof typeof PARTNER_LOGOS; size?: number }) {
  const uri = PARTNER_LOGOS[name];
  if (!uri.endsWith(".png")) return null;
  return <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" />;
}
