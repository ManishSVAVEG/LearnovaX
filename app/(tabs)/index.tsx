import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp, FadeInDown, SlideInRight } from "react-native-reanimated";
import { useApp } from "@/contexts/AppContext";
import COLORS from "@/constants/colors";
import { BadgeUnlockModal } from "@/components/BadgeUnlockModal";
import { AI_PROVIDERS, ProviderKey } from "@/lib/ai";
import { BADGES } from "@/constants/badges";

function StatCard({ value, label, color, icon, index }: { value: string | number; label: string; color: string; icon: string; index: number }) {
  return (
    <Animated.View 
      entering={FadeInDown.delay(200 + index * 100)}
      style={[styles.statCard, { borderColor: color + "40", shadowColor: color, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }]}
    >
      <View style={[styles.statIconBg, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function QuickAction({ icon, label, color, onPress, index }: { icon: string; label: string; color: string; onPress: () => void; index: number }) {
  return (
    <Animated.View entering={FadeInUp.delay(400 + index * 50)} style={styles.quickAction}>
      <Pressable
        style={({ pressed }) => [styles.quickActionGradientContainer, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}
        onPress={onPress}
      >
        <LinearGradient colors={[color + "30", color + "10"]} style={styles.quickActionGradient}>
          <View style={[styles.quickActionIcon, { backgroundColor: color + "25" }]}>
            <Ionicons name={icon as any} size={24} color={color} />
          </View>
          <Text style={styles.quickActionLabel}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, aiConfig, stats, newBadge, dismissBadge, updateStreak, checkAndAwardBadges } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    updateStreak();
    checkAndAwardBadges();
  }, []);

  const provider = aiConfig?.provider as ProviderKey | undefined;
  const providerInfo = provider ? AI_PROVIDERS[provider] : null;

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const weekData = stats?.weeklyData || [0, 0, 0, 0, 0, 0, 0];
  const maxWeek = Math.max(...weekData, 1);
  const today = new Date().getDay();

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#0A0E1A", "#05070A"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Animated.View entering={FadeInUp} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{userProfile?.username || "Scholar"}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={18} color={COLORS.warning} />
            <Text style={styles.streakText}>{stats?.streak || 0}</Text>
          </View>
        </Animated.View>

        {providerInfo && aiConfig && (
          <Animated.View entering={FadeInUp.delay(100)}>
            <Pressable
              style={styles.aiProviderBanner}
              onPress={() => router.push("/api-setup")}
            >
              <LinearGradient
                colors={[COLORS.primaryGlow, COLORS.accentGlow]}
                style={styles.aiBannerGradient}
              >
                <View style={[styles.aiBannerIcon, { backgroundColor: providerInfo.color + "20" }]}>
                  <Ionicons name={providerInfo.icon as any} size={20} color={providerInfo.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiBannerTitle}>{providerInfo.name}</Text>
                  <Text style={styles.aiBannerModel}>{aiConfig.model}</Text>
                </View>
                <View style={styles.aiBannerStatus}>
                  <View style={styles.aiBannerDot} />
                  <Text style={styles.aiBannerStatusText}>Active</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.statsGrid}>
          <StatCard index={0} value={stats?.notesGenerated || 0} label="Notes" color={COLORS.primary} icon="document-text" />
          <StatCard index={1} value={stats?.summariesGenerated || 0} label="Summaries" color={COLORS.accent} icon="list" />
          <StatCard index={2} value={stats?.examsCompleted || 0} label="Exams" color={COLORS.danger} icon="school" />
          <StatCard index={3} value={`${stats?.accuracy || 0}%`} label="Accuracy" color={COLORS.gold} icon="trophy" />
        </View>

        <Text style={styles.sectionTitle}>Weekly Activity</Text>
        <Animated.View entering={FadeInUp.delay(300)} style={styles.weeklyCard}>
          <View style={styles.weekBars}>
            {weekData.map((val, i) => (
              <View key={i} style={styles.weekBarContainer}>
                <View
                  style={[
                    styles.weekBar,
                    {
                      height: Math.max(4, (val / maxWeek) * 60),
                      backgroundColor: i === today ? COLORS.primary : COLORS.border,
                    },
                  ]}
                />
                <Text style={[styles.weekDay, i === today && { color: COLORS.primary }]}>
                  {weekDays[i]}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.weeklyStats}>
            <Text style={styles.weeklyTotal}>
              {weekData.reduce((a, b) => a + b, 0)} sessions this week
            </Text>
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={14} color={COLORS.warning} />
              <Text style={styles.streakRowText}>{stats?.streak || 0} day streak</Text>
            </View>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            index={0}
            icon="document-text"
            label="Generate Notes"
            color={COLORS.primary}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/learn"); }}
          />
          <QuickAction
            index={1}
            icon="list"
            label="Summarize"
            color={COLORS.accent}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/learn"); }}
          />
          <QuickAction
            index={2}
            icon="chatbubbles"
            label="Ask AI"
            color="#7B5EF8"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/chat"); }}
          />
          <QuickAction
            index={3}
            icon="pencil"
            label="Take Exam"
            color={COLORS.danger}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/practice"); }}
          />
          <QuickAction
            index={4}
            icon="bookmark"
            label="Library"
            color={COLORS.gold}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/library"); }}
          />
          <QuickAction
            index={5}
            icon="calendar"
            label="Schedule"
            color={COLORS.warning}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/scheduler"); }}
          />
        </View>

        <Text style={styles.sectionTitle}>Your Subjects</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {(userProfile?.subjects || []).map((s, i) => (
            <Animated.View key={s} entering={SlideInRight.delay(i * 100)} style={styles.subjectChip}>
              <Text style={styles.subjectChipText}>{s}</Text>
            </Animated.View>
          ))}
        </ScrollView>


        <Text style={styles.sectionTitle}>Badges Earned</Text>
        <View style={styles.badgesRow}>
          {(stats?.badges || []).slice(0, 8).map((id) => {
            const badge = BADGES.find((b) => b.id === id);
            if (!badge) return null;
            return (
              <Pressable key={id} onPress={() => router.push("/badges")}>
                <View style={[styles.badgeIcon, { backgroundColor: badge.color + "20" }]}>
                  <Ionicons name={badge.icon as any} size={20} color={badge.color} />
                </View>
              </Pressable>
            );
          })}
          <Pressable style={styles.moreBadgesBtn} onPress={() => router.push("/badges")}>
            <Text style={styles.moreBadgesText}>View All</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </Pressable>
        </View>
      </ScrollView>

      <BadgeUnlockModal badgeId={newBadge} onDismiss={dismissBadge} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary },
  username: { fontFamily: "Poppins_700Bold", fontSize: 24, color: COLORS.text },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.warning + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.warning },

  aiProviderBanner: { marginHorizontal: 20, marginBottom: 20, borderRadius: 16, overflow: "hidden" },
  aiBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
  },
  aiBannerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  aiBannerTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.text },
  aiBannerModel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  aiBannerStatus: { flexDirection: "row", alignItems: "center", gap: 4 },
  aiBannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  aiBannerStatusText: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.success },

  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  statIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontFamily: "Poppins_700Bold", fontSize: 24 },
  statLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted },

  weeklyCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 20,
  },
  weekBars: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 80, marginBottom: 8 },
  weekBarContainer: { alignItems: "center", gap: 6, flex: 1 },
  weekBar: { width: 20, borderRadius: 4 },
  weekDay: { fontFamily: "Poppins_500Medium", fontSize: 11, color: COLORS.textMuted },
  weeklyStats: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  weeklyTotal: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textSecondary },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  streakRowText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.warning },

  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  quickAction: { width: "30.5%" },
  quickActionGradientContainer: { borderRadius: 16, overflow: "hidden" },
  quickActionGradient: { padding: 16, alignItems: "center", gap: 8, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  quickActionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickActionLabel: { fontFamily: "Poppins_500Medium", fontSize: 11, color: COLORS.text, textAlign: "center" },

  subjectChip: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  subjectChipText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.textSecondary },

  badgesRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  badgeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  moreBadgesBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  moreBadgesText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.primary },
});
