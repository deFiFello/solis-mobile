import { Tabs } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const C = {
  bg: "#0a0a0a",
  border: "#1A1A1A",
  accent: "#BDFF00",
  muted: "rgba(255,255,255,0.25)",
  white: "#FFFFFF",
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: "index", label: "MARKETS", icon: "◇" },
    { name: "earn", label: "EARN", icon: "◈" },
    { name: "swap", label: "SWAP", icon: "⇄" },
    { name: "more", label: "MORE", icon: "⋯" },
  ];

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route: any, index: number) => {
        const tabConfig = tabs[index];
        if (!tabConfig) return null;

        const isFocused = state.index === index;
        const isSwap = tabConfig.name === "swap";

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
            {isSwap ? (
              <View style={styles.swapButton}>
                <Text style={{ color: "#000", fontSize: 16 }}>{tabConfig.icon}</Text>
              </View>
            ) : (
              <View style={styles.iconWrap}>
                <Text style={{ color: isFocused ? C.accent : C.muted, fontSize: 18 }}>{tabConfig.icon}</Text>
              </View>
            )}
            <Text style={[styles.tabLabel, { color: isSwap ? C.accent : isFocused ? C.accent : C.muted }]}>
              {tabConfig.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props: any) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "#000" },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="earn" />
      <Tabs.Screen name="swap" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  swapButton: {
    width: 36,
    height: 36,
    borderWidth: 1.5,
    borderColor: C.accent,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontFamily: "InterSemiBold",
    fontSize: 8,
    letterSpacing: 1,
  },
});
