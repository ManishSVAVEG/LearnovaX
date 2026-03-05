import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import Animated, { FadeInUp, FadeInRight, Layout } from "react-native-reanimated";
import { useApp } from "@/contexts/AppContext";
import COLORS from "@/constants/colors";
import { ScheduleItem } from "@/lib/storage";
import { scheduleStudyNotifications, cancelSessionNotifications } from "@/lib/notifications";

const DURATIONS = [30, 45, 60, 90, 120];

export default function SchedulerScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, schedule, addScheduleItem, updateScheduleItem, removeScheduleItem } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newSubject, setNewSubject] = useState(userProfile?.subjects?.[0] || "");
  const [newTopic, setNewTopic] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState("10:00");
  const [newDuration, setNewDuration] = useState(60);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const addSession = async () => {
    if (!newTopic.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    const sessionId = Crypto.randomUUID();
    const sessionDate = new Date(`${newDate}T${newTime}:00`);

    const item: ScheduleItem = {
      id: sessionId,
      subject: newSubject,
      topic: newTopic.trim(),
      date: sessionDate.toISOString(),
      duration: newDuration,
      completed: false,
      missed: false,
    };

    await addScheduleItem(item);
    
    // Schedule 3 notifications
    await scheduleStudyNotifications(newTopic.trim(), newSubject, sessionDate, sessionId);

    setShowAdd(false);
    setNewTopic("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const markComplete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateScheduleItem(id, { completed: true, missed: false });
    await cancelSessionNotifications(id);
  };

  const deleteSession = async (id: string) => {
    Alert.alert("Delete Session", "Remove this study session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await removeScheduleItem(id);
          await cancelSessionNotifications(id);
        },
      },
    ]);
  };

  const upcoming = schedule.filter((s) => !s.completed && !s.missed).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const completed = schedule.filter((s) => s.completed);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
  };

  const isOverdue = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#0A0E1A", "#05070A"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Study Scheduler</Text>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}>
        <Animated.View entering={FadeInUp.delay(100)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{upcoming.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{completed.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.danger }]}>{schedule.filter(s => s.missed).length}</Text>
            <Text style={styles.statLabel}>Missed</Text>
          </View>
        </Animated.View>

        {upcoming.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            {upcoming.map((session, index) => {
              const overdue = isOverdue(session.date);
              return (
                <Animated.View 
                  key={session.id} 
                  entering={FadeInRight.delay(200 + index * 100)}
                  layout={Layout.springify()}
                  style={[styles.sessionCard, overdue && { borderColor: COLORS.warning + "50" }]}
                >
                  <View style={[styles.sessionStripe, { backgroundColor: overdue ? COLORS.warning : COLORS.primary }]} />
                  <View style={styles.sessionContent}>
                    <View style={styles.sessionHeader}>
                      <View>
                        <Text style={styles.sessionTopic}>{session.topic}</Text>
                        <Text style={styles.sessionSubject}>{session.subject}</Text>
                      </View>
                      <View style={styles.sessionActions}>
                        <Pressable
                          onPress={() => markComplete(session.id)}
                          style={styles.completeBtn}
                        >
                          <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.success} />
                        </Pressable>
                        <Pressable onPress={() => deleteSession(session.id)}>
                          <Ionicons name="trash-outline" size={20} color={COLORS.textMuted} />
                        </Pressable>
                      </View>
                    </View>
                    <View style={styles.sessionMeta}>
                      <View style={styles.sessionMetaItem}>
                        <Ionicons name="calendar" size={13} color={COLORS.textMuted} />
                        <Text style={styles.sessionMetaText}>{formatDate(session.date)}</Text>
                      </View>
                      <View style={styles.sessionMetaItem}>
                        <Ionicons name="time" size={13} color={COLORS.textMuted} />
                        <Text style={styles.sessionMetaText}>{formatTime(session.date)}</Text>
                      </View>
                      <View style={styles.sessionMetaItem}>
                        <Ionicons name="hourglass" size={13} color={COLORS.textMuted} />
                        <Text style={styles.sessionMetaText}>{session.duration} min</Text>
                      </View>
                      {overdue && (
                        <View style={styles.overdueTag}>
                          <Text style={styles.overdueText}>Overdue</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </>
        )}


        {completed.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Completed</Text>
            {completed.slice(0, 5).map((session) => (
              <View key={session.id} style={[styles.sessionCard, styles.sessionCardCompleted]}>
                <View style={[styles.sessionStripe, { backgroundColor: COLORS.success }]} />
                <View style={styles.sessionContent}>
                  <View style={styles.sessionHeader}>
                    <View>
                      <Text style={[styles.sessionTopic, { opacity: 0.6 }]}>{session.topic}</Text>
                      <Text style={styles.sessionSubject}>{session.subject}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {schedule.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No sessions planned</Text>
            <Text style={styles.emptyText}>Add study sessions to stay on track with your learning goals</Text>
            <Pressable style={styles.emptyBtn} onPress={() => setShowAdd(true)}>
              <LinearGradient colors={COLORS.gradientPrimary} style={styles.emptyBtnGradient}>
                <Ionicons name="add" size={18} color={COLORS.white} />
                <Text style={styles.emptyBtnText}>Add Session</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {showAdd && (
        <View style={styles.addSheet}>
          <View style={[styles.addSheetContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.addSheetHeader}>
              <Text style={styles.addSheetTitle}>New Study Session</Text>
              <Pressable onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.addLabel}>Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {(userProfile?.subjects || ["General"]).map((s) => (
                <Pressable key={s} style={[styles.chip, newSubject === s && styles.chipActive]} onPress={() => setNewSubject(s)}>
                  <Text style={[styles.chipText, newSubject === s && styles.chipTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.addLabel}>Topic</Text>
            <TextInput
              style={styles.addInput}
              placeholder="What will you study?"
              placeholderTextColor={COLORS.textMuted}
              value={newTopic}
              onChangeText={setNewTopic}
            />

            <View style={styles.dateTimeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.addLabel}>Date</Text>
                <TextInput style={styles.addInput} value={newDate} onChangeText={setNewDate} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addLabel}>Time</Text>
                <TextInput style={styles.addInput} value={newTime} onChangeText={setNewTime} placeholder="HH:MM" placeholderTextColor={COLORS.textMuted} />
              </View>
            </View>

            <Text style={styles.addLabel}>Duration</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map((d) => (
                <Pressable key={d} style={[styles.durationBtn, newDuration === d && styles.durationBtnActive]} onPress={() => setNewDuration(d)}>
                  <Text style={[styles.durationText, newDuration === d && styles.durationTextActive]}>{d}m</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.saveBtn, !newTopic.trim() && styles.saveBtnDisabled]}
              onPress={addSession}
              disabled={!newTopic.trim()}
            >
              <LinearGradient
                colors={newTopic.trim() ? COLORS.gradientPrimary : ["#2A3560", "#2A3560"]}
                style={styles.saveBtnGradient}
              >
                <Ionicons name="calendar" size={18} color={COLORS.white} />
                <Text style={styles.saveBtnText}>Schedule Session</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.text, textAlign: "center" },
  addBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  statsRow: { flexDirection: "row", gap: 10, paddingVertical: 16 },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, alignItems: "center", gap: 4 },
  statValue: { fontFamily: "Poppins_700Bold", fontSize: 24, color: COLORS.text },
  statLabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted },

  sectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.text, marginBottom: 12, marginTop: 8 },

  sessionCard: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, flexDirection: "row", overflow: "hidden", marginBottom: 10 },
  sessionCardCompleted: { opacity: 0.7 },
  sessionStripe: { width: 4 },
  sessionContent: { flex: 1, padding: 14 },
  sessionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  sessionTopic: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.text },
  sessionSubject: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted },
  sessionActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  completeBtn: { padding: 2 },
  sessionMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
  sessionMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  sessionMetaText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted },
  overdueTag: { backgroundColor: COLORS.warning + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  overdueText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: COLORS.warning },

  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.text },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  emptyBtn: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  emptyBtnGradient: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 24 },
  emptyBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.white },

  addSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addSheetContent: { padding: 20 },
  addSheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  addSheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: COLORS.text },

  addLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  addInput: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.text, marginBottom: 14 },
  dateTimeRow: { flexDirection: "row", gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  chipActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  chipText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.primary },

  durationRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  durationBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
  durationBtnActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  durationText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.textSecondary },
  durationTextActive: { color: COLORS.primary },

  saveBtn: { borderRadius: 14, overflow: "hidden" },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  saveBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.white },
});
