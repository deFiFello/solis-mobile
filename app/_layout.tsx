import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts, SpaceMono_400Regular, SpaceMono_700Bold } from "@expo-google-fonts/space-mono";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WalletProvider } from "../contexts/WalletProvider";
import { SeekerProvider } from "../contexts/SeekerProvider";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: SpaceMono_400Regular,
    SpaceMonoBold: SpaceMono_700Bold,
    Inter: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterSemiBold: Inter_600SemiBold,
    InterBold: Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#BDFF00" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <WalletProvider>
        <SeekerProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#000" } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="asset/[symbol]" options={{ animation: "slide_from_right" }} />
          </Stack>
        </SeekerProvider>
      </WalletProvider>
    </SafeAreaProvider>
  );
}
