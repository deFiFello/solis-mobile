// ═══════════════════════════════════════════════════════════
// MARKET TICKER — Scrolling macro data
// ═══════════════════════════════════════════════════════════
// Fix: animation starts once on mount. Data updates don't restart scroll.
// The bug was: useEffect([data]) restarted animation every 30s refresh.

import React, { useRef, useEffect, useMemo } from "react";
import { View, Text, Animated, StyleSheet, Dimensions } from "react-native";

type MacroDataPoint = {
  label: string;
  value: string;
  change: string;
  up: boolean;
};

type Props = {
  data: MacroDataPoint[];
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_WIDTH = 180; // approx width per ticker item
const SPEED = 40; // pixels per second

export default function MarketTicker({ data }: Props) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const animRunning = useRef(false);
  // Store latest data in ref so animation loop reads current values
  const dataRef = useRef<MacroDataPoint[]>(data);

  // Keep dataRef current without restarting animation
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Triple the data for seamless loop
  const tripled = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data, ...data, ...data];
  }, [data]);

  const totalWidth = tripled.length * ITEM_WIDTH;
  const oneSetWidth = data.length * ITEM_WIDTH;
  const duration = (oneSetWidth / SPEED) * 1000;

  // Start animation ONCE
  useEffect(() => {
    if (animRunning.current || data.length === 0) return;
    animRunning.current = true;

    const startLoop = () => {
      scrollX.setValue(0);
      Animated.timing(scrollX, {
        toValue: -oneSetWidth,
        duration,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) startLoop();
      });
    };

    startLoop();

    return () => {
      scrollX.stopAnimation();
      animRunning.current = false;
    };
  }, [data.length > 0]); // Only trigger once when data first arrives

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>Loading market data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.row,
          { width: totalWidth, transform: [{ translateX: scrollX }] },
        ]}
      >
        {tripled.map((item, i) => (
          <View key={`${item.label}-${i}`} style={styles.item}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={[styles.change, item.up ? styles.up : styles.down]}>
              {item.change}
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 28,
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 28,
  },
  item: {
    width: ITEM_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  label: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontFamily: "Inter",
  },
  value: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: "Inter",
    fontVariant: ["tabular-nums"],
  },
  change: {
    fontSize: 11,
    fontFamily: "Inter",
    fontVariant: ["tabular-nums"],
  },
  up: { color: "#BDFF00" },
  down: { color: "#FF4444" },
  placeholder: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 28,
    fontFamily: "Inter",
  },
});
