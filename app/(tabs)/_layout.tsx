import { Tabs } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: "index", label: "MARKETS", icon: "◇" },
    { name: "stake", label: "STAKE", icon: "◈" },
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
                <Text style={{ color: "#fff", fontSize: 16 }}>{tabConfig.icon}</Text>
              </View>
            ) : (
              <View style={styles.iconWrap}>
                <Text style={{ color: isFocused ? "#fff" : "#555", fontSize: 18 }}>{tabConfig.icon}</Text>
              </View>
            )}
            <Text style={[styles.tabLabel, { color: isSwap ? "#fff" : isFocused ? "#fff" : "#555" }]}>
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
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "#000" },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="stake" />
      <Tabs.Screen name="swap" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#0a0a0a",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
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
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 8,
    letterSpacing: 0.5,
  },
});