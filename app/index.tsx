import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import COLORS from "@/constants/colors";

export default function IndexScreen() {
  const { isLoading, isLoggedIn, isOnboarded, hasAIConfig } = useApp();

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      router.replace("/login");
    } else if (!isOnboarded) {
      router.replace("/onboarding");
    } else if (!hasAIConfig) {
      router.replace("/api-setup");
    } else {
      router.replace("/(tabs)");
    }
  }, [isLoading, isLoggedIn, isOnboarded, hasAIConfig]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );
}
