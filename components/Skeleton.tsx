import { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle, Easing } from "react-native";

type Props = {
  width: number | string;
  height: number;
  style?: ViewStyle;
};

/**
 * Shimmer skeleton placeholder — replaces boring "--" text.
 * Subtle pulse animation that signals "loading" without feeling broken.
 */
export default function Skeleton({ width, height, style }: Props) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.7,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          backgroundColor: "#1A1A1A",
          opacity: anim,
        },
        style,
      ]}
    />
  );
}
