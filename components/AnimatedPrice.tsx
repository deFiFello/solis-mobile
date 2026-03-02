import { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, View, ViewStyle, TextStyle } from "react-native";

const C = {
  accent: "#BDFF00",
  red: "#f87171",
  white: "#FFFFFF",
};

type Props = {
  value: string;        // formatted price like "$97,000" or "$1.00"
  style?: TextStyle;
  flashOnChange?: boolean;
};

/**
 * Price that briefly flashes green/red when it changes.
 * Gives that "live trading terminal" dopamine hit.
 */
export default function AnimatedPrice({ value, style, flashOnChange = true }: Props) {
  const flashAnim = useRef(new Animated.Value(0)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (!flashOnChange || value === prevValue.current || prevValue.current === "--") {
      prevValue.current = value;
      return;
    }

    // Determine direction
    const prev = parseFloat(prevValue.current.replace(/[$,%]/g, "")) || 0;
    const curr = parseFloat(value.replace(/[$,%]/g, "")) || 0;

    prevValue.current = value;
    if (prev === curr) return;

    // Flash animation
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const backgroundColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(189,255,0,0)", "rgba(189,255,0,0.12)"],
  });

  return (
    <Animated.View style={{ backgroundColor, paddingHorizontal: 2 }}>
      <Text style={style}>{value}</Text>
    </Animated.View>
  );
}
