import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { BADGES } from "@/constants/badges";
import COLORS from "@/constants/colors";

interface Props {
  badgeId: string | null;
  onDismiss: () => void;
}

export function BadgeUnlockModal({ badgeId, onDismiss }: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const badge = badgeId ? BADGES.find((b) => b.id === badgeId) : null;

  useEffect(() => {
    if (badge) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSequence(
        withSpring(1.2, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 150 })
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [badge]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!badge) return null;

  const difficultyColor =
    badge.difficulty === "Easy" ? COLORS.success :
    badge.difficulty === "Medium" ? COLORS.warning :
    badge.difficulty === "Hard" ? COLORS.danger : COLORS.gold;

  return (
    <Modal visible={!!badgeId} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View style={[styles.card, animStyle]}>
          <LinearGradient
            colors={["#1C2240", "#242C4E"]}
            style={styles.cardGradient}
          >
            <View style={styles.sparkles}>
              <Ionicons name="sparkles" size={20} color={COLORS.gold} style={styles.sparkle1} />
              <Ionicons name="sparkles" size={14} color={COLORS.gold} style={styles.sparkle2} />
              <Ionicons name="sparkles" size={16} color={COLORS.gold} style={styles.sparkle3} />
            </View>

            <LinearGradient
              colors={[badge.color + "40", badge.color + "20"]}
              style={styles.iconBg}
            >
              <Ionicons name={badge.icon as any} size={40} color={badge.color} />
            </LinearGradient>

            <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor + "20" }]}>
              <Text style={[styles.difficultyText, { color: difficultyColor }]}>{badge.difficulty}</Text>
            </View>

            <Text style={styles.unlockLabel}>Badge Unlocked!</Text>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={styles.badgeDesc}>{badge.description}</Text>

            <Pressable style={styles.closeBtn} onPress={onDismiss}>
              <LinearGradient colors={COLORS.gradientPrimary} style={styles.closeBtnGradient}>
                <Text style={styles.closeBtnText}>Awesome!</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 300,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.gold + "40",
  },
  cardGradient: { padding: 32, alignItems: "center", gap: 12 },
  sparkles: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  sparkle1: { position: "absolute", top: 20, left: 20 },
  sparkle2: { position: "absolute", top: 30, right: 30 },
  sparkle3: { position: "absolute", bottom: 60, left: 40 },
  iconBg: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  difficultyBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  difficultyText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  unlockLabel: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textSecondary },
  badgeName: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.text, textAlign: "center" },
  badgeDesc: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  closeBtn: { marginTop: 8, borderRadius: 14, overflow: "hidden", width: "100%" },
  closeBtnGradient: { paddingVertical: 14, alignItems: "center" },
  closeBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.white },
});
