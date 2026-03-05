import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import COLORS from "@/constants/colors";
import { AI_PROVIDERS, ProviderKey } from "@/lib/ai";
import { BADGES } from "@/constants/badges";

function MenuItem({ icon, label, sub, color, onPress, rightEl, badge }: {
  icon: string; label: string; sub?: string; color?: string; onPress: () => void; rightEl?: React.ReactNode; badge?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={[styles.menuIconBg, { backgroundColor: (color || COLORS.primary) + "20" }]}>
        <Ionicons name={icon as any} size={20} color={color || COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.menuLabel}>{label}</Text>
          {badge && (
            <View style={styles.menuBadge}>
              <Text style={styles.menuBadgeText}>{badge}</Text>
            </View>
          )}
        </View>
        {sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      {rightEl || <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />}
    </Pressable>
  );
}

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, aiConfig, stats, examResults, logout } = useApp();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const provider = aiConfig?.provider as ProviderKey | undefined;
  const providerInfo = provider ? AI_PROVIDERS[provider] : null;

  const earnedBadges = BADGES.filter((b) => stats?.badges.includes(b.id));

  const accuracyColor =
    (stats?.accuracy || 0) >= 80 ? COLORS.success :
    (stats?.accuracy || 0) >= 50 ? COLORS.warning : COLORS.danger;

  const weakSubjectCount = (() => {
    if (!examResults || !Array.isArray(examResults)) return 0;
    const map = new Map<string, number[]>();
    examResults.forEach((e) => {
      const pct = e.totalMarks > 0 ? (e.scoredMarks / e.totalMarks) * 100 : 0;
      const arr = map.get(e.subject) || [];
      arr.push(pct);
      map.set(e.subject, arr);
    });
    let count = 0;
    map.forEach((scores) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < 70) count++;
    });
    return count;
  })();

  const totalActivity = (stats?.notesGenerated || 0) + (stats?.summariesGenerated || 0) + (stats?.examsCompleted || 0) + (stats?.chatMessages || 0);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#0A0E1A", "#0A0E1A"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.profileSection}>
          <LinearGradient colors={COLORS.gradientPrimary} style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(userProfile?.username || "S").charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          <Text style={styles.username}>{userProfile?.username || "Scholar"}</Text>
          <Text style={styles.profileSub}>
            {userProfile?.grade} · {userProfile?.board}
          </Text>
          <Text style={styles.country}>{userProfile?.country}</Text>

          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{stats?.streak || 0}</Text>
              <Text style={styles.profileStatLabel}>Streak</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{earnedBadges.length}</Text>
              <Text style={styles.profileStatLabel}>Badges</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatValue, { color: accuracyColor }]}>
                {stats?.accuracy || 0}%
              </Text>
              <Text style={styles.profileStatLabel}>Accuracy</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{totalActivity}</Text>
              <Text style={styles.profileStatLabel}>Activities</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Tools</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon="bookmark" label="My Library" sub={`${stats?.librarySaved || 0} saved items`} color={COLORS.gold} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/library"); }} />
            <MenuItem icon="bar-chart" label="Analytics" sub="Progress & performance" color={COLORS.accent} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/analytics"); }} />
            <MenuItem
              icon="fitness"
              label="Weakness Detector"
              sub="Find & fix your weak areas"
              color={COLORS.danger}
              badge={weakSubjectCount > 0 ? `${weakSubjectCount} weak` : undefined}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/weakness"); }}
            />
            <MenuItem icon="calendar" label="Study Scheduler" sub="Plan your study sessions" color={COLORS.warning} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/scheduler"); }} />
            <MenuItem icon="trophy" label="Badges" sub={`${earnedBadges.length} of ${BADGES.length} earned`} color={COLORS.gold} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/badges"); }} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Configuration</Text>
          <Pressable style={styles.aiProviderCard} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/api-setup"); }}>
            {providerInfo ? (
              <LinearGradient colors={[COLORS.primaryGlow, COLORS.accentGlow]} style={styles.aiCardGradient}>
                <View style={[styles.aiCardIcon, { backgroundColor: providerInfo.color + "20" }]}>
                  <Ionicons name={providerInfo.icon as any} size={24} color={providerInfo.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiCardProvider}>{providerInfo.name}</Text>
                  <Text style={styles.aiCardModel}>{aiConfig?.model}</Text>
                </View>
                <View style={styles.aiCardStatus}>
                  <View style={styles.activeDot} />
                  <Text style={styles.aiCardStatusText}>Active</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </LinearGradient>
            ) : (
              <View style={styles.aiCardGradient}>
                <View style={[styles.aiCardIcon, { backgroundColor: COLORS.border }]}>
                  <Ionicons name="key" size={24} color={COLORS.textMuted} />
                </View>
                <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 14, color: COLORS.textSecondary, flex: 1 }}>
                  No API key set up
                </Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Subjects</Text>
          <View style={styles.subjectsContainer}>
            {(userProfile?.subjects || []).map((s) => (
              <View key={s} style={styles.subjectTag}>
                <Ionicons name="book-outline" size={12} color={COLORS.primary} />
                <Text style={styles.subjectTagText}>{s}</Text>
              </View>
            ))}
            {(userProfile?.subjects || []).length === 0 && (
              <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textMuted }}>No subjects set</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            {[
              { label: "Notes", value: stats?.notesGenerated || 0, icon: "document-text", color: COLORS.primary },
              { label: "Summaries", value: stats?.summariesGenerated || 0, icon: "list", color: COLORS.accent },
              { label: "Exams", value: stats?.examsCompleted || 0, icon: "school", color: COLORS.danger },
              { label: "Chats", value: stats?.chatMessages || 0, icon: "chatbubbles", color: "#7B5EF8" },
            ].map((stat) => (
              <View key={stat.label} style={[styles.statCard, { borderColor: stat.color + "30" }]}>
                <View style={[styles.statIconBg, { backgroundColor: stat.color + "20" }]}>
                  <Ionicons name={stat.icon as any} size={16} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="create"
              label="Edit Profile"
              sub="Update your study context"
              color={COLORS.primary}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/onboarding"); }}
            />
            <MenuItem
              icon="log-out"
              label="Logout"
              sub="Sign out of your account"
              color={COLORS.danger}
              onPress={handleLogout}
            />
          </View>
        </View>

        <View style={styles.appInfo}>
          <LinearGradient colors={COLORS.gradientPrimary} style={styles.appInfoIcon}>
            <Ionicons name="school" size={20} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.appInfoTitle}>LearnovaX</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0 · 100% Free · No Subscriptions</Text>
          <Text style={styles.appInfoNote}>API keys stored securely on-device only. No data sent to our servers.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  profileSection: { alignItems: "center", paddingTop: 24, paddingBottom: 24, paddingHorizontal: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontFamily: "Poppins_700Bold", fontSize: 36, color: COLORS.white },
  username: { fontFamily: "Poppins_700Bold", fontSize: 24, color: COLORS.text },
  profileSub: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  country: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  profileStats: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 16, marginTop: 20, borderWidth: 1, borderColor: COLORS.border },
  profileStat: { flex: 1, alignItems: "center" },
  profileStatValue: { fontFamily: "Poppins_700Bold", fontSize: 20, color: COLORS.text },
  profileStatLabel: { fontFamily: "Poppins_400Regular", fontSize: 10, color: COLORS.textMuted },
  profileStatDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  menuGroup: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIconBg: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontFamily: "Poppins_500Medium", fontSize: 15, color: COLORS.text },
  menuSub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  menuBadge: { backgroundColor: COLORS.danger + "20", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  menuBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: COLORS.danger },

  aiProviderCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border },
  aiCardGradient: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  aiCardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  aiCardProvider: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.text },
  aiCardModel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted },
  aiCardStatus: { flexDirection: "row", alignItems: "center", gap: 4 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  aiCardStatusText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.success },

  subjectsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  subjectTag: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  subjectTagText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.textSecondary },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", gap: 6 },
  statIconBg: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  statValue: { fontFamily: "Poppins_700Bold", fontSize: 22 },
  statLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },

  appInfo: { alignItems: "center", paddingBottom: 20, gap: 8 },
  appInfoIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  appInfoTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: COLORS.text },
  appInfoVersion: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted },
  appInfoNote: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted, textAlign: "center", paddingHorizontal: 40 },
});
