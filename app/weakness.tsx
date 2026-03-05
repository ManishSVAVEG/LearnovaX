import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import COLORS from "@/constants/colors";
import { callAI, buildSystemPrompt } from "@/lib/ai";

interface SubjectPerformance {
  subject: string;
  totalExams: number;
  avgScore: number;
  lowestScore: number;
  highestScore: number;
  trend: "improving" | "declining" | "stable";
}

interface WeakTopic {
  question: string;
  subject: string;
  score: number;
  maxScore: number;
  explanation: string;
}

export default function WeaknessScreen() {
  const insets = useSafeAreaInsets();
  const { examResults, userProfile, aiConfig, stats } = useApp();
  const [studyPlan, setStudyPlan] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const subjectPerformance = useMemo<SubjectPerformance[]>(() => {
    if (!examResults || !Array.isArray(examResults)) return [];
    const map = new Map<string, { scores: number[]; dates: string[] }>();
    examResults.forEach((exam) => {
      const pct = exam.totalMarks > 0 ? Math.round((exam.scoredMarks / exam.totalMarks) * 100) : 0;
      const existing = map.get(exam.subject) || { scores: [], dates: [] };
      existing.scores.push(pct);
      existing.dates.push(exam.completedAt);
      map.set(exam.subject, existing);
    });

    return Array.from(map.entries()).map(([subject, data]) => {
      const { scores } = data;
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const half = Math.floor(scores.length / 2);
      const recentAvg = scores.slice(half).reduce((a, b) => a + b, 0) / (scores.length - half || 1);
      const oldAvg = scores.slice(0, half).reduce((a, b) => a + b, 0) / (half || 1);
      const trend: "improving" | "declining" | "stable" =
        recentAvg > oldAvg + 5 ? "improving" : recentAvg < oldAvg - 5 ? "declining" : "stable";

      return {
        subject,
        totalExams: scores.length,
        avgScore: avg,
        lowestScore: Math.min(...scores),
        highestScore: Math.max(...scores),
        trend,
      };
    }).sort((a, b) => a.avgScore - b.avgScore);
  }, [examResults]);

  const weakTopics = useMemo<WeakTopic[]>(() => {
    const topics: WeakTopic[] = [];
    examResults.slice(0, 10).forEach((exam) => {
      exam.questions.forEach((q) => {
        const pct = q.maxScore > 0 ? q.score / q.maxScore : 0;
        if (pct < 0.6) {
          topics.push({
            question: q.question,
            subject: exam.subject,
            score: q.score,
            maxScore: q.maxScore,
            explanation: q.explanation,
          });
        }
      });
    });
    return topics.sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore)).slice(0, 15);
  }, [examResults]);

  const weakSubjects = subjectPerformance.filter(s => s.avgScore < 70).slice(0, 3);
  const strongSubjects = subjectPerformance.filter(s => s.avgScore >= 80).slice(0, 3);

  const generateStudyPlan = async () => {
    if (!aiConfig) {
      Alert.alert("No AI Provider", "Please set up your API key first.");
      return;
    }
    if (examResults.length === 0) {
      Alert.alert("No Data", "Complete some exams first to generate a personalized study plan.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    setStudyPlan("");

    try {
      const systemPrompt = userProfile ? buildSystemPrompt(userProfile) : "You are an expert study coach.";
      const weakData = weakSubjects.map(s =>
        `${s.subject}: avg ${s.avgScore}%, ${s.totalExams} exams, trend: ${s.trend}`
      ).join("; ");
      const strongData = strongSubjects.map(s =>
        `${s.subject}: avg ${s.avgScore}%`
      ).join("; ");
      const weakTopicsData = weakTopics.slice(0, 5).map(t =>
        `"${t.question.slice(0, 80)}" in ${t.subject} (${t.score}/${t.maxScore})`
      ).join("\n");

      const prompt = `As a personalized AI study coach, create a structured WEAKNESS IMPROVEMENT PLAN based on this student's performance:

Weak Areas: ${weakData || "No weak subjects identified yet"}
Strong Areas: ${strongData || "Not enough data"}

Recently Missed Questions:
${weakTopicsData || "No data yet"}

Overall Accuracy: ${stats?.accuracy || 0}%
Total Exams: ${examResults.length}
Current Streak: ${stats?.streak || 0} days

Create a detailed 2-week study plan that:
1. Prioritizes the weakest subjects/topics
2. Schedules specific revision sessions
3. Recommends practice strategies for each weak area
4. Includes daily time allocation (in minutes)
5. Adds confidence-building milestones
6. Gives specific study techniques for each subject
7. Includes weekly goals and progress checkpoints

Format with clear headings and daily schedule structure.`;

      await callAI(
        aiConfig,
        [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
        (chunk) => setStudyPlan((prev) => prev + chunk)
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to generate study plan.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getScoreColor = (score: number) =>
    score >= 80 ? COLORS.success : score >= 60 ? COLORS.warning : COLORS.danger;

  const getTrendIcon = (trend: string) =>
    trend === "improving" ? "trending-up" : trend === "declining" ? "trending-down" : "remove";

  const getTrendColor = (trend: string) =>
    trend === "improving" ? COLORS.success : trend === "declining" ? COLORS.danger : COLORS.textMuted;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#0A0E1A", "#0A0E1A"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Weakness Detector</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}>

        {examResults.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient colors={["#FF4D6A20", "#FF4D6A10"]} style={styles.emptyIcon}>
              <Ionicons name="fitness" size={40} color={COLORS.danger} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No Exam Data Yet</Text>
            <Text style={styles.emptyText}>
              Complete some exams in the Practice tab to analyze your weaknesses and get a personalized improvement plan.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push("/(tabs)/practice")}>
              <LinearGradient colors={["#FF4D6A", "#FF6B35"]} style={styles.emptyBtnGradient}>
                <Ionicons name="school" size={18} color={COLORS.white} />
                <Text style={styles.emptyBtnText}>Take an Exam</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <LinearGradient colors={["#FF4D6A15", "#FF4D6A05"]} style={styles.summaryGradient}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{weakSubjects.length}</Text>
                    <Text style={styles.summaryLabel}>Weak Subjects</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: COLORS.warning }]}>{weakTopics.length}</Text>
                    <Text style={styles.summaryLabel}>Weak Questions</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: COLORS.success }]}>{strongSubjects.length}</Text>
                    <Text style={styles.summaryLabel}>Strong Subjects</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <Text style={styles.sectionTitle}>Subject Performance</Text>
            {subjectPerformance.length === 0 ? (
              <Text style={styles.noDataText}>No subject data yet</Text>
            ) : (
              subjectPerformance.map((sp) => (
                <View key={sp.subject} style={styles.subjectCard}>
                  <View style={styles.subjectHeader}>
                    <View style={styles.subjectLeft}>
                      <View style={[styles.subjectDot, { backgroundColor: getScoreColor(sp.avgScore) }]} />
                      <Text style={styles.subjectName}>{sp.subject}</Text>
                    </View>
                    <View style={styles.subjectRight}>
                      <Ionicons name={getTrendIcon(sp.trend) as any} size={16} color={getTrendColor(sp.trend)} />
                      <Text style={[styles.subjectScore, { color: getScoreColor(sp.avgScore) }]}>
                        {sp.avgScore}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.subjectBar}>
                    <View style={[styles.subjectBarFill, { width: `${sp.avgScore}%` as any, backgroundColor: getScoreColor(sp.avgScore) }]} />
                  </View>

                  <View style={styles.subjectStats}>
                    <Text style={styles.subjectStat}>{sp.totalExams} exams</Text>
                    <Text style={styles.subjectStat}>Low: {sp.lowestScore}%</Text>
                    <Text style={styles.subjectStat}>High: {sp.highestScore}%</Text>
                    <Text style={[styles.subjectTrend, { color: getTrendColor(sp.trend) }]}>
                      {sp.trend === "improving" ? "📈 Improving" : sp.trend === "declining" ? "📉 Declining" : "➡️ Stable"}
                    </Text>
                  </View>
                </View>
              ))
            )}

            {weakTopics.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Questions You Struggled With</Text>
                {weakTopics.slice(0, 8).map((topic, i) => {
                  const pct = topic.maxScore > 0 ? Math.round((topic.score / topic.maxScore) * 100) : 0;
                  return (
                    <View key={i} style={[styles.weakCard, { borderColor: getScoreColor(pct) + "30" }]}>
                      <View style={styles.weakHeader}>
                        <View style={[styles.weakScore, { backgroundColor: getScoreColor(pct) + "20" }]}>
                          <Text style={[styles.weakScoreText, { color: getScoreColor(pct) }]}>
                            {topic.score}/{topic.maxScore}
                          </Text>
                        </View>
                        <Text style={styles.weakSubject}>{topic.subject}</Text>
                      </View>
                      <Text style={styles.weakQuestion} numberOfLines={3}>{topic.question}</Text>
                      {topic.explanation ? (
                        <View style={styles.weakHint}>
                          <Ionicons name="information-circle" size={13} color={COLORS.textMuted} />
                          <Text style={styles.weakHintText} numberOfLines={2}>{topic.explanation}</Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </>
            )}

            <Pressable
              style={[styles.planBtn, isGenerating && { opacity: 0.7 }]}
              onPress={generateStudyPlan}
              disabled={isGenerating}
            >
              <LinearGradient colors={["#7B5EF8", "#4F8EF7"]} style={styles.planBtnGradient}>
                {isGenerating ? (
                  <>
                    <ActivityIndicator color={COLORS.white} />
                    <Text style={styles.planBtnText}>Generating Plan...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color={COLORS.white} />
                    <Text style={styles.planBtnText}>Generate AI Study Plan</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {studyPlan ? (
              <View style={styles.planCard}>
                <View style={styles.planCardHeader}>
                  <LinearGradient colors={["#7B5EF8", "#4F8EF7"]} style={styles.planCardIcon}>
                    <Ionicons name="sparkles" size={16} color={COLORS.white} />
                  </LinearGradient>
                  <Text style={styles.planCardTitle}>Your Personalized Study Plan</Text>
                </View>
                <Text style={styles.planCardText}>{studyPlan}</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.text, textAlign: "center" },

  emptyState: { alignItems: "center", paddingTop: 60, gap: 16, paddingHorizontal: 20 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.text },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22 },
  emptyBtn: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  emptyBtnGradient: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 28 },
  emptyBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.white },

  summaryCard: { borderRadius: 16, overflow: "hidden", marginTop: 16, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  summaryGradient: { padding: 20 },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontFamily: "Poppins_700Bold", fontSize: 28 },
  summaryLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  summaryDivider: { width: 1, height: 40, backgroundColor: COLORS.border },

  sectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: COLORS.text, marginTop: 20, marginBottom: 12 },
  noDataText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textMuted, textAlign: "center", paddingVertical: 20 },

  subjectCard: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10 },
  subjectHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  subjectLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  subjectDot: { width: 10, height: 10, borderRadius: 5 },
  subjectName: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.text },
  subjectRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  subjectScore: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  subjectBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginBottom: 8, overflow: "hidden" },
  subjectBarFill: { height: 6, borderRadius: 3 },
  subjectStats: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subjectStat: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  subjectTrend: { fontFamily: "Poppins_500Medium", fontSize: 11 },

  weakCard: { backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  weakHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  weakScore: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  weakScoreText: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  weakSubject: { fontFamily: "Poppins_500Medium", fontSize: 12, color: COLORS.textSecondary },
  weakQuestion: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.text, lineHeight: 19 },
  weakHint: { flexDirection: "row", alignItems: "flex-start", gap: 4, marginTop: 6 },
  weakHintText: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted, flex: 1, lineHeight: 16 },

  planBtn: { borderRadius: 16, overflow: "hidden", marginTop: 20, marginBottom: 8 },
  planBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  planBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: COLORS.white },

  planCard: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: "#7B5EF830", marginBottom: 20 },
  planCardHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  planCardIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  planCardTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: COLORS.text },
  planCardText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.text, lineHeight: 21, padding: 14 },
});
