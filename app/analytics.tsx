import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Rect, Text as SvgText } from "react-native-svg";
import { useApp } from "@/contexts/AppContext";
import COLORS from "@/constants/colors";

const { width } = Dimensions.get("window");

function AccuracyRing({ accuracy }: { accuracy: number }) {
  const size = 120;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = (accuracy / 100) * circumference;
  const color = accuracy >= 80 ? COLORS.success : accuracy >= 50 ? COLORS.warning : COLORS.danger;

  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={COLORS.border} strokeWidth={10} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={10}
          fill="none"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
        <SvgText x={size / 2} y={size / 2 + 6} textAnchor="middle" fill={COLORS.text} fontSize="22" fontWeight="bold">
          {accuracy}%
        </SvgText>
      </Svg>
      <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.textSecondary }}>
        Overall Accuracy
      </Text>
    </View>
  );
}

function WeeklyChart({ data }: { data: number[] }) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const maxVal = Math.max(...data, 1);
  const chartHeight = 80;
  const barWidth = (width - 100) / 7;

  return (
    <View style={styles.chartContainer}>
      <Svg width={width - 60} height={chartHeight + 30}>
        {data.map((val, i) => {
          const barHeight = Math.max(4, (val / maxVal) * chartHeight);
          const x = i * barWidth + barWidth / 2 - 12;
          const y = chartHeight - barHeight;
          const isToday = i === new Date().getDay();
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={y} width={24} height={barHeight} rx={6} fill={isToday ? COLORS.primary : COLORS.border} opacity={isToday ? 1 : 0.6} />
              <SvgText x={x + 12} y={chartHeight + 16} textAnchor="middle" fill={isToday ? COLORS.primary : COLORS.textMuted} fontSize="10">
                {days[i]}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

function StatRow({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <View style={styles.statRow}>
      <View style={[styles.statRowIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.statRowLabel}>{label}</Text>
      <Text style={[styles.statRowValue, { color }]}>{value}</Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { stats, examResults } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const totalActivity = (stats?.notesGenerated || 0) + (stats?.summariesGenerated || 0) + (stats?.examsCompleted || 0) + (stats?.chatMessages || 0);

  const recentExams = examResults.slice(0, 5);
  const avgExamScore = recentExams.length > 0
    ? Math.round(recentExams.reduce((sum, e) => sum + (e.scoredMarks / e.totalMarks) * 100, 0) / recentExams.length)
    : 0;

  const subjectMastery = useMemo(() => {
    if (!examResults || !Array.isArray(examResults)) return [];
    const map = new Map<string, { scores: number[]; exams: number }>();
    examResults.forEach((e) => {
      const pct = e.totalMarks > 0 ? Math.round((e.scoredMarks / e.totalMarks) * 100) : 0;
      const existing = map.get(e.subject) || { scores: [], exams: 0 };
      existing.scores.push(pct);
      existing.exams++;
      map.set(e.subject, existing);
    });
    return Array.from(map.entries()).map(([subject, data]) => ({
      subject,
      avg: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      exams: data.exams,
    })).sort((a, b) => b.avg - a.avg).slice(0, 6);
  }, [examResults]);

  const summaryTypeStats = useMemo(() => {
    return [
      { label: "Ultra Quick", value: stats?.quickRevisions || 0, color: "#FF6B35" },
      { label: "Exam-Oriented", value: (stats?.summariesGenerated || 0) - (stats?.crashSheetsGenerated || 0) - (stats?.formulaExtractions || 0) - (stats?.definitionSets || 0) - (stats?.memoryTriggers || 0) - (stats?.quickRevisions || 0) - (stats?.conceptBreakdowns || 0) - (stats?.weaknessSummaries || 0), color: COLORS.primary },
      { label: "Crash Sheet", value: stats?.crashSheetsGenerated || 0, color: COLORS.accent },
      { label: "Formula", value: stats?.formulaExtractions || 0, color: COLORS.gold },
      { label: "Definition", value: stats?.definitionSets || 0, color: COLORS.danger },
      { label: "Memory Trigger", value: stats?.memoryTriggers || 0, color: "#7B5EF8" },
      { label: "Concept", value: stats?.conceptBreakdowns || 0, color: "#4F8EF7" },
      { label: "Weakness", value: stats?.weaknessSummaries || 0, color: "#FF4D6A" },
    ].filter(s => s.value > 0);
  }, [stats]);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#0A0E1A", "#0A0E1A"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Pressable style={styles.weaknessBtn} onPress={() => router.push("/weakness")}>
          <Ionicons name="fitness" size={20} color={COLORS.danger} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}>

        <View style={styles.accuracySection}>
          <AccuracyRing accuracy={stats?.accuracy || 0} />
          <View style={styles.accuracyStats}>
            <View style={styles.accuracyStat}>
              <Text style={[styles.accuracyStatValue, { color: COLORS.primary }]}>{stats?.examsCompleted || 0}</Text>
              <Text style={styles.accuracyStatLabel}>Exams Done</Text>
            </View>
            <View style={styles.accuracyStat}>
              <Text style={[styles.accuracyStatValue, { color: COLORS.gold }]}>{stats?.perfectScores || 0}</Text>
              <Text style={styles.accuracyStatLabel}>Perfect Scores</Text>
            </View>
            <View style={styles.accuracyStat}>
              <Text style={[styles.accuracyStatValue, { color: COLORS.success }]}>{stats?.highScores || 0}</Text>
              <Text style={styles.accuracyStatLabel}>90%+ Scores</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Weekly Activity</Text>
          <WeeklyChart data={stats?.weeklyData || [0, 0, 0, 0, 0, 0, 0]} />
          <View style={styles.weeklyLegend}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Today</Text>
            <View style={[styles.legendDot, { backgroundColor: COLORS.border }]} />
            <Text style={styles.legendText}>Other days</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Activity Breakdown</Text>
          <StatRow icon="document-text" label="Notes Generated" value={stats?.notesGenerated || 0} color={COLORS.primary} />
          <View style={styles.divider} />
          <StatRow icon="list" label="Summaries Created" value={stats?.summariesGenerated || 0} color={COLORS.accent} />
          <View style={styles.divider} />
          <StatRow icon="school" label="Exams Completed" value={stats?.examsCompleted || 0} color={COLORS.danger} />
          <View style={styles.divider} />
          <StatRow icon="chatbubbles" label="AI Messages Sent" value={stats?.chatMessages || 0} color="#7B5EF8" />
          <View style={styles.divider} />
          <StatRow icon="calendar" label="Scheduled Completed" value={stats?.scheduledCompleted || 0} color={COLORS.warning} />
          <View style={styles.divider} />
          <StatRow icon="flash" label="Total Activities" value={totalActivity} color={COLORS.gold} />
        </View>

        {summaryTypeStats.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Summary Types Used</Text>
            {summaryTypeStats.map((st, i) => (
              <React.Fragment key={st.label}>
                {i > 0 && <View style={styles.divider} />}
                <StatRow icon="list" label={st.label} value={st.value} color={st.color} />
              </React.Fragment>
            ))}
            <View style={styles.divider} />
            <View style={styles.summaryTypeProgress}>
              <Text style={styles.summaryTypeProgressLabel}>Summary Types Explored</Text>
              <Text style={[styles.summaryTypeProgressValue, { color: COLORS.accent }]}>
                {stats?.allSummaryTypesUsed || 0}/8
              </Text>
            </View>
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Study Consistency</Text>
          <StatRow icon="flame" label="Current Streak" value={`${stats?.streak || 0} days`} color={COLORS.warning} />
          <View style={styles.divider} />
          <StatRow icon="bookmark" label="Library Items" value={stats?.librarySaved || 0} color={COLORS.gold} />
          <View style={styles.divider} />
          <StatRow icon="trophy" label="Badges Earned" value={stats?.badges?.length || 0} color={COLORS.gold} />
          <View style={styles.divider} />
          <StatRow icon="grid" label="Subjects Studied" value={stats?.subjectsStudied?.length || 0} color={COLORS.accent} />
          <View style={styles.divider} />
          <StatRow icon="sunny" label="Early Sessions" value={stats?.earlyBirdSessions || 0} color="#FFB340" />
          <View style={styles.divider} />
          <StatRow icon="moon" label="Night Sessions" value={stats?.nightOwlSessions || 0} color="#7B5EF8" />
        </View>

        {subjectMastery.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.subjectMasteryHeader}>
              <Text style={styles.sectionTitle}>Subject Mastery</Text>
              <Pressable onPress={() => router.push("/weakness")}>
                <Text style={styles.weaknessLink}>Full Analysis →</Text>
              </Pressable>
            </View>
            {subjectMastery.map((sm, i) => {
              const color = sm.avg >= 80 ? COLORS.success : sm.avg >= 60 ? COLORS.warning : COLORS.danger;
              return (
                <View key={sm.subject} style={styles.masteryRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.masteryLabelRow}>
                      <Text style={styles.masterySubject}>{sm.subject}</Text>
                      <Text style={[styles.masteryScore, { color }]}>{sm.avg}%</Text>
                    </View>
                    <View style={styles.masteryBar}>
                      <View style={[styles.masteryBarFill, { width: `${sm.avg}%` as any, backgroundColor: color }]} />
                    </View>
                    <Text style={styles.masteryExams}>{sm.exams} exam{sm.exams !== 1 ? "s" : ""}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {recentExams.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent Exam Performance</Text>
            <View style={styles.avgScoreRow}>
              <Text style={styles.avgScoreLabel}>Average Score</Text>
              <Text style={[styles.avgScoreValue, { color: avgExamScore >= 80 ? COLORS.success : avgExamScore >= 50 ? COLORS.warning : COLORS.danger }]}>
                {avgExamScore}%
              </Text>
            </View>
            {recentExams.map((exam) => {
              const pct = Math.round((exam.scoredMarks / exam.totalMarks) * 100);
              const color = pct >= 80 ? COLORS.success : pct >= 50 ? COLORS.warning : COLORS.danger;
              return (
                <View key={exam.id} style={styles.examRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.examRowTitle} numberOfLines={1}>{exam.topic}</Text>
                    <Text style={styles.examRowSub}>{exam.subject} · {new Date(exam.completedAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[styles.examRowScore, { color }]}>{pct}%</Text>
                </View>
              );
            })}
          </View>
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
  weaknessBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  accuracySection: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, marginVertical: 16, borderWidth: 1, borderColor: COLORS.border, gap: 16 },
  accuracyStats: { flex: 1, gap: 12 },
  accuracyStat: { alignItems: "flex-start" },
  accuracyStatValue: { fontFamily: "Poppins_700Bold", fontSize: 22 },
  accuracyStatLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },

  sectionCard: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16 },
  sectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: COLORS.text, marginBottom: 16 },

  chartContainer: { alignItems: "center", marginVertical: 8 },
  weeklyLegend: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  legendText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted, marginRight: 12 },

  statRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  statRowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statRowLabel: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary, flex: 1 },
  statRowValue: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },

  summaryTypeProgress: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  summaryTypeProgressLabel: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary },
  summaryTypeProgressValue: { fontFamily: "Poppins_700Bold", fontSize: 18 },

  subjectMasteryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  weaknessLink: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.danger },
  masteryRow: { marginBottom: 12 },
  masteryLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  masterySubject: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.text },
  masteryScore: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  masteryBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: "hidden", marginBottom: 2 },
  masteryBarFill: { height: 6, borderRadius: 3 },
  masteryExams: { fontFamily: "Poppins_400Regular", fontSize: 10, color: COLORS.textMuted },

  avgScoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  avgScoreLabel: { fontFamily: "Poppins_500Medium", fontSize: 14, color: COLORS.textSecondary },
  avgScoreValue: { fontFamily: "Poppins_700Bold", fontSize: 28 },
  examRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  examRowTitle: { fontFamily: "Poppins_500Medium", fontSize: 14, color: COLORS.text },
  examRowSub: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  examRowScore: { fontFamily: "Poppins_700Bold", fontSize: 18 },
});
