import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import { useApp } from "@/contexts/AppContext";
import COLORS from "@/constants/colors";
import { callAI, buildSystemPrompt } from "@/lib/ai";
import { ExamResult } from "@/lib/storage";

type ExamState = "setup" | "taking" | "evaluating" | "done";

interface Question {
  question: string;
  marks: number;
  userAnswer: string;
}

interface ParsedQuestion {
  question: string;
  marks: number;
}

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { aiConfig, userProfile, addExamResult, addLibraryItem, incrementStat, updateStats, checkAndAwardBadges } = useApp();

  const [examState, setExamState] = useState<ExamState>("setup");
  const [subject, setSubject] = useState(userProfile?.subjects?.[0] || "");
  const [topic, setTopic] = useState("");
  const [totalMarks, setTotalMarks] = useState("20");
  const [numQuestions, setNumQuestions] = useState("5");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [timerMinutes, setTimerMinutes] = useState("15");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (examState === "taking" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            submitExam();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examState, timeLeft]);

  const generateExam = async () => {
    if (!topic.trim() || !aiConfig) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);

    try {
      const systemPrompt = userProfile ? buildSystemPrompt(userProfile) : "You are an exam generator.";
      const prompt = `Generate an exam paper for ${subject || "General"} on the topic: "${topic}".

Requirements:
- Total marks: ${totalMarks}
- Number of questions: ${numQuestions}
- Difficulty: ${difficulty}
- Distribute marks appropriately across questions

CRITICAL: Return ONLY a JSON array with no other text. Format:
[
  {"question": "Question text here?", "marks": 4},
  {"question": "Another question?", "marks": 2}
]

Make questions diverse: definitions, explanations, calculations, analysis. Marks per question: 1-${Math.floor(parseInt(totalMarks) / 2)}.`;

      const response = await callAI(aiConfig, [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ]);

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Could not parse exam questions");

      const parsed: ParsedQuestion[] = JSON.parse(jsonMatch[0]);
      setQuestions(parsed.map((q) => ({ ...q, userAnswer: "" })));
      setTimeLeft(parseInt(timerMinutes) * 60);
      startTimeRef.current = Date.now();
      setExamState("taking");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to generate exam. Try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  };

  const submitExam = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!aiConfig) return;
    setExamState("evaluating");
    setIsEvaluating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const maxTime = parseInt(timerMinutes) * 60;
    const isSpeedExam = timeSpent < maxTime / 2;

    try {
      const systemPrompt = userProfile ? buildSystemPrompt(userProfile) : "You are an exam evaluator.";
      const evalPrompt = `Evaluate these exam answers for the topic "${topic}" in ${subject}:

${questions.map((q, i) => `Q${i + 1} (${q.marks} marks): ${q.question}
Student Answer: ${q.userAnswer || "(No answer given)"}`).join("\n\n")}

CRITICAL: Return ONLY a JSON array. For each question:
[
  {
    "question": "question text",
    "userAnswer": "student answer",
    "correctAnswer": "correct answer/model answer",
    "score": 2,
    "maxScore": 4,
    "explanation": "brief feedback on the answer"
  }
]`;

      const evalResponse = await callAI(aiConfig, [
        { role: "system", content: systemPrompt },
        { role: "user", content: evalPrompt },
      ]);

      const jsonMatch = evalResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Could not parse evaluation");

      const evaluated = JSON.parse(jsonMatch[0]);
      const totalScored = evaluated.reduce((sum: number, q: any) => sum + (q.score || 0), 0);
      const totalPossible = evaluated.reduce((sum: number, q: any) => sum + (q.maxScore || 0), 0);
      const accuracy = totalPossible > 0 ? Math.round((totalScored / totalPossible) * 100) : 0;

      const examResult: ExamResult = {
        id: Crypto.randomUUID(),
        subject: subject || "General",
        topic,
        totalMarks: totalPossible,
        scoredMarks: totalScored,
        totalQuestions: questions.length,
        timeSpent,
        completedAt: new Date().toISOString(),
        questions: evaluated,
      };

      setResult(examResult);
      setExamState("done");

      await addExamResult(examResult);
      await incrementStat("examsCompleted");

      const stats = await import("@/lib/storage").then(m => m.storage.getStats());
      const newAccuracy = Math.round((stats.accuracy * stats.examsCompleted + accuracy) / (stats.examsCompleted + 1));
      await updateStats({ accuracy: newAccuracy });

      if (accuracy === 100) await updateStats({ perfectScores: stats.perfectScores + 1 });
      if (accuracy >= 90) await updateStats({ highScores: stats.highScores + 1 });
      if (isSpeedExam) await updateStats({ speedExams: stats.speedExams + 1 });

      await checkAndAwardBadges();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert("Evaluation Error", err?.message || "Failed to evaluate. Your answers are saved.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const timerColor = timeLeft < 60 ? COLORS.danger : timeLeft < 180 ? COLORS.warning : COLORS.success;

  if (!aiConfig) {
    return (
      <View style={[styles.container, { paddingTop: topPad, justifyContent: "center", alignItems: "center" }]}>
        <LinearGradient colors={["#0A0E1A", "#121828"]} style={StyleSheet.absoluteFill} />
        <Ionicons name="key" size={48} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No AI Provider</Text>
        <Text style={styles.emptyText}>Set up your API key to take exams</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#0A0E1A", "#0A0E1A"]} style={StyleSheet.absoluteFill} />

      {examState === "setup" && (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Exam Generator</Text>
            <View style={styles.headerBadge}>
              <Ionicons name="school" size={16} color={COLORS.danger} />
              <Text style={styles.headerBadgeText}>AI-Powered</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {(userProfile?.subjects || ["General"]).map((s) => (
                <Pressable key={s} style={[styles.chip, subject === s && styles.chipActive]} onPress={() => { setSubject(s); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                  <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Topic</Text>
            <TextInput style={styles.topicInput} placeholder="e.g. Thermodynamics" placeholderTextColor={COLORS.textMuted} value={topic} onChangeText={setTopic} />

            <View style={styles.settingsRow}>
              <View style={styles.settingBox}>
                <Text style={styles.settingLabel}>Total Marks</Text>
                <TextInput style={styles.settingInput} value={totalMarks} onChangeText={setTotalMarks} keyboardType="numeric" placeholder="20" placeholderTextColor={COLORS.textMuted} />
              </View>
              <View style={styles.settingBox}>
                <Text style={styles.settingLabel}>Questions</Text>
                <TextInput style={styles.settingInput} value={numQuestions} onChangeText={setNumQuestions} keyboardType="numeric" placeholder="5" placeholderTextColor={COLORS.textMuted} />
              </View>
              <View style={styles.settingBox}>
                <Text style={styles.settingLabel}>Timer (min)</Text>
                <TextInput style={styles.settingInput} value={timerMinutes} onChangeText={setTimerMinutes} keyboardType="numeric" placeholder="15" placeholderTextColor={COLORS.textMuted} />
              </View>
            </View>

            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.optionRow}>
              {(["Easy", "Medium", "Hard"] as const).map((d) => (
                <Pressable key={d} style={[styles.optionBtn, difficulty === d && styles.optionBtnActive]} onPress={() => { setDifficulty(d); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                  <Text style={[styles.optionText, difficulty === d && styles.optionTextActive]}>{d}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={[styles.generateBtn, (!topic.trim() || isGenerating) && styles.generateBtnDisabled]} onPress={generateExam} disabled={!topic.trim() || isGenerating}>
              <LinearGradient colors={topic.trim() ? ["#FF4D6A", "#FF6B35"] : ["#2A3560", "#2A3560"]} style={styles.generateBtnGradient}>
                {isGenerating ? <ActivityIndicator color={COLORS.white} /> : (
                  <>
                    <Ionicons name="create" size={20} color={COLORS.white} />
                    <Text style={styles.generateBtnText}>Generate Exam</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Recent Results</Text>
            </View>
          </ScrollView>
        </>
      )}

      {examState === "taking" && (
        <>
          <View style={styles.examHeader}>
            <View>
              <Text style={styles.examHeaderTitle}>{topic}</Text>
              <Text style={styles.examHeaderSub}>{subject} · {questions.length} questions · {totalMarks} marks</Text>
            </View>
            <View style={[styles.timerBox, { backgroundColor: timerColor + "20", borderColor: timerColor }]}>
              <Ionicons name="timer" size={16} color={timerColor} />
              <Text style={[styles.timerText, { color: timerColor }]}>{formatTime(timeLeft)}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
            {questions.map((q, i) => (
              <View key={i} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <View style={styles.questionNum}>
                    <Text style={styles.questionNumText}>Q{i + 1}</Text>
                  </View>
                  <Text style={styles.questionMarks}>{q.marks} mark{q.marks > 1 ? "s" : ""}</Text>
                </View>
                <Text style={styles.questionText}>{q.question}</Text>
                <TextInput
                  style={styles.answerInput}
                  placeholder="Type your answer here..."
                  placeholderTextColor={COLORS.textMuted}
                  value={q.userAnswer}
                  onChangeText={(t) => setQuestions((prev) => prev.map((pq, pi) => pi === i ? { ...pq, userAnswer: t } : pq))}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            ))}

            <Pressable style={styles.submitBtn} onPress={submitExam}>
              <LinearGradient colors={["#FF4D6A", "#FF6B35"]} style={styles.submitBtnGradient}>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
                <Text style={styles.submitBtnText}>Submit Exam</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </>
      )}

      {examState === "evaluating" && (
        <View style={styles.evaluatingContainer}>
          <LinearGradient colors={COLORS.gradientPrimary} style={styles.evalIcon}>
            <ActivityIndicator color={COLORS.white} size="large" />
          </LinearGradient>
          <Text style={styles.evalTitle}>AI is Evaluating...</Text>
          <Text style={styles.evalText}>Analyzing your answers and calculating scores</Text>
        </View>
      )}

      {examState === "done" && result && (
        <>
          <View style={styles.header}>
            <Pressable onPress={() => setExamState("setup")} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Exam Results</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
            <View style={styles.scoreCard}>
              <LinearGradient
                colors={result.scoredMarks / result.totalMarks >= 0.8 ? ["#22D46E20", "#22D46E10"] : result.scoredMarks / result.totalMarks >= 0.5 ? ["#FFB34020", "#FFB34010"] : ["#FF4D6A20", "#FF4D6A10"]}
                style={styles.scoreCardGradient}
              >
                <Text style={styles.scoreLabel}>{result.topic}</Text>
                <Text style={[styles.scoreValue, {
                  color: result.scoredMarks / result.totalMarks >= 0.8 ? COLORS.success : result.scoredMarks / result.totalMarks >= 0.5 ? COLORS.warning : COLORS.danger
                }]}>
                  {result.scoredMarks}/{result.totalMarks}
                </Text>
                <Text style={styles.scorePercent}>
                  {Math.round((result.scoredMarks / result.totalMarks) * 100)}% · {result.subject}
                </Text>
                <Text style={styles.scoreTime}>
                  Completed in {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
                </Text>
              </LinearGradient>
            </View>

            {result.questions.map((q, i) => {
              const pct = q.maxScore > 0 ? q.score / q.maxScore : 0;
              const color = pct >= 0.8 ? COLORS.success : pct >= 0.5 ? COLORS.warning : COLORS.danger;
              return (
                <View key={i} style={[styles.resultQuestion, { borderColor: color + "30" }]}>
                  <View style={styles.resultQuestionHeader}>
                    <Text style={styles.resultQuestionNum}>Q{i + 1}</Text>
                    <Text style={[styles.resultQuestionScore, { color }]}>{q.score}/{q.maxScore}</Text>
                  </View>
                  <Text style={styles.resultQuestionText}>{q.question}</Text>
                  <View style={styles.resultAnswerSection}>
                    <Text style={styles.resultAnswerLabel}>Your Answer</Text>
                    <Text style={styles.resultAnswerText}>{q.userAnswer || "(No answer)"}</Text>
                  </View>
                  <View style={[styles.resultCorrectSection, { backgroundColor: color + "10" }]}>
                    <Text style={[styles.resultAnswerLabel, { color }]}>Model Answer</Text>
                    <Text style={[styles.resultAnswerText, { color: COLORS.text }]}>{q.correctAnswer}</Text>
                  </View>
                  {q.explanation && (
                    <View style={styles.explanationSection}>
                      <Ionicons name="information-circle" size={14} color={COLORS.textMuted} />
                      <Text style={styles.explanationText}>{q.explanation}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            <Pressable style={styles.newExamBtn} onPress={() => { setExamState("setup"); setResult(null); setQuestions([]); setTopic(""); }}>
              <LinearGradient colors={COLORS.gradientPrimary} style={styles.newExamBtnGradient}>
                <Ionicons name="add-circle" size={20} color={COLORS.white} />
                <Text style={styles.newExamBtnText}>New Exam</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.text },
  headerBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.dangerGlow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  headerBadgeText: { fontFamily: "Poppins_500Medium", fontSize: 12, color: COLORS.danger },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  label: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  chipActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  chipText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.primary },
  topicInput: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontFamily: "Poppins_400Regular", fontSize: 15, color: COLORS.text, marginBottom: 16 },

  settingsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  settingBox: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 12, alignItems: "center" },
  settingLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
  settingInput: { fontFamily: "Poppins_700Bold", fontSize: 20, color: COLORS.text, textAlign: "center", minWidth: 40 },

  optionRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  optionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
  optionBtnActive: { backgroundColor: COLORS.dangerGlow, borderColor: COLORS.danger },
  optionText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.textSecondary },
  optionTextActive: { color: COLORS.danger },

  generateBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  generateBtnDisabled: { opacity: 0.5 },
  generateBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  generateBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: COLORS.white },

  recentHeader: { marginTop: 4 },
  sectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: COLORS.text, marginBottom: 12 },

  examHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  examHeaderTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: COLORS.text },
  examHeaderSub: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textSecondary },
  timerBox: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  timerText: { fontFamily: "Poppins_700Bold", fontSize: 18 },

  questionCard: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16 },
  questionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  questionNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center" },
  questionNumText: { fontFamily: "Poppins_700Bold", fontSize: 13, color: COLORS.primary },
  questionMarks: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.textSecondary },
  questionText: { fontFamily: "Poppins_500Medium", fontSize: 15, color: COLORS.text, marginBottom: 12, lineHeight: 22 },
  answerInput: { backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.text, minHeight: 100 },

  submitBtn: { borderRadius: 16, overflow: "hidden", marginTop: 8 },
  submitBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  submitBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: COLORS.white },

  evaluatingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  evalIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  evalTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.text },
  evalText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },

  scoreCard: { borderRadius: 20, overflow: "hidden", marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  scoreCardGradient: { padding: 24, alignItems: "center", gap: 8 },
  scoreLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: COLORS.text },
  scoreValue: { fontFamily: "Poppins_700Bold", fontSize: 48 },
  scorePercent: { fontFamily: "Poppins_500Medium", fontSize: 15, color: COLORS.textSecondary },
  scoreTime: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted },

  resultQuestion: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  resultQuestionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  resultQuestionNum: { fontFamily: "Poppins_700Bold", fontSize: 14, color: COLORS.textSecondary },
  resultQuestionScore: { fontFamily: "Poppins_700Bold", fontSize: 16 },
  resultQuestionText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: COLORS.text, marginBottom: 10, lineHeight: 20 },
  resultAnswerSection: { marginBottom: 8 },
  resultAnswerLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 },
  resultAnswerText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  resultCorrectSection: { borderRadius: 10, padding: 10, marginBottom: 8 },
  explanationSection: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  explanationText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted, flex: 1, fontStyle: "italic" },

  newExamBtn: { borderRadius: 16, overflow: "hidden", marginTop: 8, marginBottom: 20 },
  newExamBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  newExamBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: COLORS.white },

  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.text, marginTop: 16 },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary },
});
