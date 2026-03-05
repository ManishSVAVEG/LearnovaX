import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import COLORS from "@/constants/colors";
import { UserProfile } from "@/lib/storage";

const COUNTRIES = ["Pakistan", "India", "Bangladesh", "UK", "USA", "Canada", "Australia", "UAE", "Saudi Arabia", "Other"];

const BOARDS: Record<string, string[]> = {
  Pakistan: ["Federal Board", "Punjab Board", "Sindh Board", "KPK Board", "Balochistan Board", "AJK Board", "Cambridge (CAIE)"],
  India: ["CBSE", "ICSE", "State Board", "IB", "Cambridge"],
  Bangladesh: ["Dhaka Board", "NCTB", "Cambridge"],
  UK: ["Edexcel", "AQA", "OCR", "Cambridge IGCSE"],
  USA: ["Common Core", "AP Board", "SAT Prep", "ACT Prep"],
  Canada: ["Ontario Curriculum", "BC Curriculum", "Alberta Curriculum"],
  Australia: ["ACARA", "ATAR", "IB Australia"],
  UAE: ["ADEC", "KHDA", "Cambridge UAE", "IB UAE"],
  "Saudi Arabia": ["Saudi MOE", "Cambridge KSA", "IB KSA"],
  Other: ["National Board", "Cambridge International", "IB (International Baccalaureate)", "Custom"],
};

const GRADES = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12 / A-Level / Pre-University"];

const COMMON_SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "History", "Geography", "Computer Science", "Economics", "Accounting", "Business Studies", "Islamic Studies", "Pakistan Studies", "Art & Design"];

type Step = "welcome" | "country" | "board" | "grade" | "subjects" | "name";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setOnboarded } = useApp();
  const [step, setStep] = useState<Step>("welcome");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [board, setBoard] = useState("");
  const [grade, setGrade] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");

  const steps: Step[] = ["welcome", "country", "board", "grade", "subjects", "name"];
  const stepIndex = steps.indexOf(step);

  const toggleSubject = (s: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const addCustomSubject = () => {
    if (customSubject.trim() && !subjects.includes(customSubject.trim())) {
      setSubjects((prev) => [...prev, customSubject.trim()]);
      setCustomSubject("");
    }
  };

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = steps[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const prev = steps[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const finish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const profile: UserProfile = {
      username: username.trim() || "Scholar",
      country,
      board,
      grade,
      subjects,
      createdAt: new Date().toISOString(),
    };
    await setOnboarded(profile);
    router.replace("/api-setup");
  };

  const canContinue = () => {
    switch (step) {
      case "welcome": return true;
      case "country": return !!country;
      case "board": return !!board;
      case "grade": return !!grade;
      case "subjects": return subjects.length > 0;
      case "name": return true;
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#0A0E1A", "#121828"]} style={StyleSheet.absoluteFill} />

      {step !== "welcome" && (
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </Pressable>
          <View style={styles.progressBar}>
            {steps.slice(1).map((s, i) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  i <= stepIndex - 1 && { backgroundColor: COLORS.primary, width: 24 },
                ]}
              />
            ))}
          </View>
          <View style={{ width: 40 }} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === "welcome" && (
          <View style={styles.welcomeContainer}>
            <LinearGradient
              colors={COLORS.gradientPrimary}
              style={styles.iconCircle}
            >
              <Ionicons name="school" size={48} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.welcomeTitle}>LearnovaX</Text>
            <Text style={styles.welcomeSubtitle}>
              Your free AI-powered study companion
            </Text>
            <View style={styles.featureList}>
              {[
                { icon: "document-text", text: "Generate structured study notes" },
                { icon: "chatbubbles", text: "AI assistant aligned to your syllabus" },
                { icon: "school", text: "Timed exams with AI evaluation" },
                { icon: "trophy", text: "Track progress & earn badges" },
              ].map((f) => (
                <View key={f.icon} style={styles.featureItem}>
                  <View style={styles.featureIconBg}>
                    <Ionicons name={f.icon as any} size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {step === "country" && (
          <View>
            <Text style={styles.stepTitle}>Where are you studying?</Text>
            <Text style={styles.stepSubtitle}>We'll tailor AI responses to your education system</Text>
            <View style={styles.chipGrid}>
              {COUNTRIES.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.chip, country === c && styles.chipSelected]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCountry(c); setBoard(""); }}
                >
                  <Text style={[styles.chipText, country === c && styles.chipTextSelected]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === "board" && (
          <View>
            <Text style={styles.stepTitle}>Education Board</Text>
            <Text style={styles.stepSubtitle}>Your curriculum determines how AI explains concepts</Text>
            <View style={styles.chipGrid}>
              {(BOARDS[country] || BOARDS.Other).map((b) => (
                <Pressable
                  key={b}
                  style={[styles.chip, board === b && styles.chipSelected]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBoard(b); }}
                >
                  <Text style={[styles.chipText, board === b && styles.chipTextSelected]}>{b}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === "grade" && (
          <View>
            <Text style={styles.stepTitle}>Your Grade / Class</Text>
            <Text style={styles.stepSubtitle}>AI will match complexity to your level</Text>
            <View style={styles.chipGrid}>
              {GRADES.map((g) => (
                <Pressable
                  key={g}
                  style={[styles.chip, grade === g && styles.chipSelected]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGrade(g); }}
                >
                  <Text style={[styles.chipText, grade === g && styles.chipTextSelected]}>{g}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === "subjects" && (
          <View>
            <Text style={styles.stepTitle}>Your Subjects</Text>
            <Text style={styles.stepSubtitle}>Select all subjects you want to study</Text>
            <View style={styles.chipGrid}>
              {COMMON_SUBJECTS.map((s) => (
                <Pressable
                  key={s}
                  style={[styles.chip, subjects.includes(s) && styles.chipSelected]}
                  onPress={() => toggleSubject(s)}
                >
                  {subjects.includes(s) && (
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.chipText, subjects.includes(s) && styles.chipTextSelected]}>{s}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customInput}
                placeholder="Add custom subject..."
                placeholderTextColor={COLORS.textMuted}
                value={customSubject}
                onChangeText={setCustomSubject}
                onSubmitEditing={addCustomSubject}
                returnKeyType="done"
              />
              <Pressable style={styles.addBtn} onPress={addCustomSubject}>
                <Ionicons name="add" size={20} color={COLORS.white} />
              </Pressable>
            </View>
            {subjects.length > 0 && (
              <Text style={styles.selectedCount}>{subjects.length} subject{subjects.length > 1 ? "s" : ""} selected</Text>
            )}
          </View>
        )}

        {step === "name" && (
          <View style={styles.nameContainer}>
            <LinearGradient colors={COLORS.gradientAccent} style={styles.iconCircle}>
              <Ionicons name="person" size={40} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepSubtitle}>Optional — used to personalize your experience</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Enter your name or nickname"
              placeholderTextColor={COLORS.textMuted}
              value={username}
              onChangeText={setUsername}
              autoFocus
              returnKeyType="done"
            />
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.continueBtn, !canContinue() && styles.continueBtnDisabled]}
          onPress={step === "name" ? finish : goNext}
          disabled={!canContinue()}
        >
          <LinearGradient
            colors={canContinue() ? COLORS.gradientPrimary : ["#2A3560", "#2A3560"]}
            style={styles.continueBtnGradient}
          >
            <Text style={styles.continueBtnText}>
              {step === "welcome" ? "Get Started" : step === "name" ? "Continue to AI Setup" : "Continue"}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  progressBar: { flex: 1, flexDirection: "row", gap: 6, justifyContent: "center" },
  progressDot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    transition: "width 0.3s",
  } as any,
  content: { paddingHorizontal: 24, paddingTop: 20 },

  welcomeContainer: { alignItems: "center", paddingTop: 20 },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  welcomeTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 32,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 40,
  },
  featureList: { width: "100%", gap: 16 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryGlow,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { fontFamily: "Poppins_500Medium", fontSize: 15, color: COLORS.text, flex: 1 },

  stepTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: COLORS.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primary,
  },
  chipText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: COLORS.textSecondary },
  chipTextSelected: { color: COLORS.primary },

  customInputRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  customInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: COLORS.text,
  },
  addBtn: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCount: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: COLORS.accent,
    marginTop: 8,
  },

  nameContainer: { alignItems: "center", paddingTop: 20 },
  nameInput: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: COLORS.text,
    marginTop: 24,
    textAlign: "center",
  },

  footer: { paddingHorizontal: 24, paddingTop: 16 },
  continueBtn: { borderRadius: 16, overflow: "hidden" },
  continueBtnDisabled: { opacity: 0.5 },
  continueBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  continueBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: COLORS.white },
});
