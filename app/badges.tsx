import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import COLORS from "@/constants/colors";
import { BADGES, Badge } from "@/constants/badges";

function BadgeCard({ badge, earned }: { badge: Badge; earned: boolean }) {
  const [showDetail, setShowDetail] = useState(false);

  const diffColor =
    badge.difficulty === "Easy" ? COLORS.success :
    badge.difficulty === "Medium" ? COLORS.warning :
    badge.difficulty === "Hard" ? COLORS.danger : COLORS.gold;

  return (
    <>
      <Pressable
        style={[styles.badgeCard, !earned && styles.badgeCardLocked]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowDetail(true); }}
      >
        <View style={[styles.badgeIconBg, { backgroundColor: earned ? badge.color + "25" : COLORS.border + "30" }]}>
          {earned ? (
            <Ionicons name={badge.icon as any} size={28} color={badge.color} />
          ) : (
            <Ionicons name="lock-closed" size={20} color={COLORS.textMuted} />
          )}
        </View>
        <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]} numberOfLines={2}>
          {badge.name}
        </Text>
        <View style={[styles.diffPill, { backgroundColor: diffColor + "20" }]}>
          <Text style={[styles.diffText, { color: diffColor }]}>{badge.difficulty}</Text>
        </View>
      </Pressable>

      <Modal visible={showDetail} transparent animationType="fade" onRequestClose={() => setShowDetail(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowDetail(false)}>
          <View style={styles.detailCard}>
            <LinearGradient colors={["#1C2240", "#242C4E"]} style={styles.detailGradient}>
              <View style={[styles.detailIconBg, { backgroundColor: earned ? badge.color + "25" : COLORS.border + "30" }]}>
                {earned ? (
                  <Ionicons name={badge.icon as any} size={40} color={badge.color} />
                ) : (
                  <Ionicons name="lock-closed" size={32} color={COLORS.textMuted} />
                )}
              </View>
              <Text style={styles.detailCategory}>{badge.category}</Text>
              <Text style={styles.detailName}>{badge.name}</Text>
              <Text style={styles.detailDesc}>{badge.description}</Text>
              <View style={[styles.diffPill, { backgroundColor: diffColor + "20", alignSelf: "center" }]}>
                <Text style={[styles.diffText, { color: diffColor }]}>{badge.difficulty}</Text>
              </View>
              {earned ? (
                <View style={styles.earnedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.earnedText}>Earned!</Text>
                </View>
              ) : (
                <Text style={styles.lockedText}>Keep studying to unlock this badge</Text>
              )}
            </LinearGradient>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function BadgesScreen() {
  const insets = useSafeAreaInsets();
  const { stats } = useApp();
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const earnedIds = stats?.badges || [];

  const filtered = filter === "all" ? BADGES : filter === "earned" ? BADGES.filter(b => earnedIds.includes(b.id)) : BADGES.filter(b => !earnedIds.includes(b.id));

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#0A0E1A", "#0A0E1A"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Achievements</Text>
          <Text style={styles.headerSub}>{earnedIds.length}/{BADGES.length} earned</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <LinearGradient colors={[COLORS.gold + "20", COLORS.gold + "10"]} style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Ionicons name="trophy" size={24} color={COLORS.gold} />
            <Text style={styles.progressTitle}>Badge Progress</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(earnedIds.length / BADGES.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{earnedIds.length} of {BADGES.length} badges collected</Text>
        </LinearGradient>
      </View>

      <View style={styles.filterRow}>
        {(["all", "earned", "locked"] as const).map((f) => (
          <Pressable key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => { setFilter(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "all" ? `All (${BADGES.length})` : f === "earned" ? `Earned (${earnedIds.length})` : `Locked (${BADGES.length - earnedIds.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => <BadgeCard badge={item} earned={earnedIds.includes(item.id)} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}
        columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.text },
  headerSub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted },

  progressSection: { paddingHorizontal: 20, paddingVertical: 12 },
  progressCard: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.gold + "30", gap: 10 },
  progressHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.text },
  progressBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.gold, borderRadius: 4 },
  progressText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textSecondary },

  filterRow: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  filterBtnActive: { backgroundColor: COLORS.goldGlow, borderColor: COLORS.gold },
  filterText: { fontFamily: "Poppins_500Medium", fontSize: 11, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.gold },

  badgeCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 12, alignItems: "center", gap: 8, minHeight: 120 },
  badgeCardLocked: { opacity: 0.5 },
  badgeIconBg: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  badgeName: { fontFamily: "Poppins_500Medium", fontSize: 11, color: COLORS.text, textAlign: "center" },
  badgeNameLocked: { color: COLORS.textMuted },
  diffPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  diffText: { fontFamily: "Poppins_600SemiBold", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center" },
  detailCard: { width: 280, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border },
  detailGradient: { padding: 28, alignItems: "center", gap: 10 },
  detailIconBg: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  detailCategory: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  detailName: { fontFamily: "Poppins_700Bold", fontSize: 20, color: COLORS.text, textAlign: "center" },
  detailDesc: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textSecondary, textAlign: "center", lineHeight: 18 },
  earnedBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  earnedText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.success },
  lockedText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted, textAlign: "center" },
});
