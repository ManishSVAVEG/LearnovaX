import React, { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import { useApp } from "@/contexts/AppContext";
import COLORS from "@/constants/colors";
import { callAI, buildSystemPrompt } from "@/lib/ai";
import { LibraryItem } from "@/lib/storage";

type Mode = "notes" | "summary";
type Difficulty = "Easy" | "Medium" | "Hard";
type Length = "Short" | "Medium" | "Long";
type Tone = "Simple" | "Academic" | "Exam-Ready";
type SummaryType =
  | "ultra_quick"
  | "exam_oriented"
  | "concept_breakdown"
  | "weakness_based"
  | "crash_sheet"
  | "formula_extraction"
  | "definition_mode"
  | "memory_trigger";

const SUMMARY_TYPES: { id: SummaryType; label: string; icon: string; color: string; statKey: string }[] = [
  { id: "ultra_quick", label: "Ultra Quick Revision", icon: "flash", color: "#FF6B35", statKey: "quickRevisions" },
  { id: "exam_oriented", label: "Exam-Oriented", icon: "school", color: COLORS.primary, statKey: "" },
  { id: "concept_breakdown", label: "Concept Breakdown", icon: "git-network", color: "#7B5EF8", statKey: "conceptBreakdowns" },
  { id: "weakness_based", label: "Weakness-Based", icon: "alert-circle", color: "#FF4D6A", statKey: "weaknessSummaries" },
  { id: "crash_sheet", label: "Crash Sheet", icon: "newspaper", color: COLORS.accent, statKey: "" },
  { id: "formula_extraction", label: "Formula Extraction", icon: "calculator", color: COLORS.gold, statKey: "formulaExtractions" },
  { id: "definition_mode", label: "Definition Mode", icon: "book", color: COLORS.danger, statKey: "definitionSets" },
  { id: "memory_trigger", label: "Memory Trigger", icon: "bulb", color: "#7B5EF8", statKey: "memoryTriggers" },
];

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const { aiConfig, userProfile, addLibraryItem, incrementStat, checkAndAwardBadges, updateStats, trackSummaryType } = useApp();
  const [mode, setMode] = useState<Mode>("notes");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState(userProfile?.subjects?.[0] || "");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [length, setLength] = useState<Length>("Medium");
  const [tone, setTone] = useState<Tone>("Exam-Ready");
  const [summaryType, setSummaryType] = useState<SummaryType>("exam_oriented");
  const [result, setResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const generateContent = async () => {
    if (!topic.trim() || !aiConfig) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    setResult("");
    setSaved(false);

    try {
      const systemPrompt = userProfile ? buildSystemPrompt(userProfile) : "You are a helpful study assistant.";
      let userPrompt = "";

      if (mode === "notes") {
        userPrompt = `Generate comprehensive, exam-ready study notes on the topic: "${topic}" for ${subject || "the given subject"}.

Requirements:
- Difficulty: ${difficulty} level
- Length: ${length} (${length === "Short" ? "300-400" : length === "Medium" ? "500-700" : "800-1000"} words)
- Tone: ${tone}
- Structure with clear headings (use ## for main headings, ### for sub-headings)
- Include: Key Definitions, Core Concepts, Important Points, Examples, Exam Tips
- Highlight KEY TERMS in **bold**
- Add bullet points for easy revision
- Include 3-5 common exam questions at the end labeled as "Exam Questions:"
- Add a "Quick Recap" section at the very end`;
      } else {
        const typePrompts: Record<SummaryType, string> = {
          ultra_quick: `Create an ULTRA QUICK REVISION summary of "${topic}" for ${subject}. 
Format:
⚡ TOP 5 MUST-KNOW FACTS (numbered list)
🎯 KEY TERMS (3-5 with one-line definitions)
📝 EXAM ALERT (2-3 most likely exam points)
Maximum 200 words total. Ultra concise — only what ABSOLUTELY MUST be remembered.`,

          exam_oriented: `Create an EXAM-ORIENTED summary of "${topic}" for ${subject}.
Format:
## High-Priority Topics (⭐ mark each)
## Likely Exam Questions with Model Answers
## Key Definitions (exam style)
## Examiner Tips & Common Mistakes
## Quick Revision Points
Emphasize what examiners look for. Mark highest probability topics with ⭐⭐⭐.`,

          concept_breakdown: `Break down the concept "${topic}" in ${subject} step by step.
Format:
## What is it? (simple explanation)
## Why does it exist? (the WHY)
## How does it work? (step-by-step)
## Real-world Analogy
## How it connects to other concepts
## Common Misconceptions
## Concept Map (describe relationships in text)
Make it intuitive and deeply understandable.`,

          weakness_based: `Create a WEAKNESS-BASED REVISION PLAN for "${topic}" in ${subject}.
Assume the student is struggling with this topic.
Format:
## Common Mistakes Students Make
## Root Cause of Confusion (explain WHY students struggle)
## Step-by-Step Remediation (fix the gaps)
## Simplified Explanation (ELI15 level)
## Practice Questions for Weak Spots (5 questions from easy to medium)
## Memory Aids for Difficult Parts
## Confidence Rebuilding Tips
Focus on clarity, patience, and building from basics.`,

          crash_sheet: `Create a ONE-PAGE CRASH SHEET for "${topic}" in ${subject}.
Absolute essentials only:
## 5 KEY FACTS (numbered, one line each)
## 3 MUST-KNOW FORMULAS/DEFINITIONS
## 2 WORKED EXAMPLES
## 1 MEMORY TRICK / MNEMONIC
## ⚡ EXAM QUICK TIPS (3 bullets)
Total must fit on one page. Ultra condensed. No fluff.`,

          formula_extraction: `Extract ALL FORMULAS, equations, theorems, and mathematical relationships for "${topic}" in ${subject}.
For EACH formula:
| Formula | Variables | What it means | When to use |
Then provide:
## Worked Examples (2-3 with full working shown)
## Formula Derivation (brief)
## Common Formula Mistakes
## Formula Memory Tips
Number each formula. Organize from basic to advanced.`,

          definition_mode: `Create a comprehensive DEFINITIONS GLOSSARY for "${topic}" in ${subject}.
For EACH key term:
**Term**: [clear definition]
*Etymology/Origin*: [word roots if helpful]
*In context*: [usage in a sentence]
*Memory Hint*: [how to remember it]
---
Organize alphabetically. Include 10-20 key terms. Add a "Related Terms" cluster map at the end.`,

          memory_trigger: `Create MEMORY TRIGGERS and MNEMONICS for "${topic}" in ${subject}.
Format:
## Acronyms (create catchy acronyms for lists/steps)
## Visual Memory Hooks (describe vivid mental images)
## Story Method (turn facts into a short memorable story)
## Rhymes & Rhythms (create memory rhymes for key facts)
## Association Chains (link concepts to things students know)
## Chunking Strategy (group related info)
## 5-Minute Review Game (Q&A format for self-testing)
Make it fun, creative, and highly memorable.`,
        };
        userPrompt = typePrompts[summaryType];
      }

      let fullContent = "";
      await callAI(
        aiConfig,
        [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        (chunk) => {
          fullContent += chunk;
          setResult(fullContent);
        }
      );

      if (mode === "notes") {
        await incrementStat("notesGenerated");
        const hour = new Date().getHours();
        if (hour < 8) await incrementStat("earlyBirdSessions");
        if (hour >= 22) await incrementStat("nightOwlSessions");
      } else {
        await incrementStat("summariesGenerated");
        await trackSummaryType(summaryType);

        // Track specific summary type stats
        const typeStatMap: Partial<Record<SummaryType, string>> = {
          crash_sheet: "crashSheetsGenerated",
          formula_extraction: "formulaExtractions",
          definition_mode: "definitionSets",
          memory_trigger: "memoryTriggers",
          ultra_quick: "quickRevisions",
          concept_breakdown: "conceptBreakdowns",
          weakness_based: "weaknessSummaries",
        };
        const statKey = typeStatMap[summaryType];
        if (statKey) {
          await incrementStat(statKey as any);
        }

        const hour = new Date().getHours();
        if (hour < 8) await incrementStat("earlyBirdSessions");
        if (hour >= 22) await incrementStat("nightOwlSessions");
      }

      if (subject && userProfile?.subjects) {
        const { storage } = await import("@/lib/storage");
        const stats = await storage.getStats();
        if (!stats.subjectsStudied.includes(subject)) {
          await updateStats({ subjectsStudied: [...stats.subjectsStudied, subject] });
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await checkAndAwardBadges();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Generation failed. Please check your API key.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToLibrary = async () => {
    if (!result) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const item: LibraryItem = {
      id: Crypto.randomUUID(),
      type: mode === "notes" ? "note" : "summary",
      title: `${topic} — ${mode === "notes" ? "Notes" : SUMMARY_TYPES.find(s => s.id === summaryType)?.label || "Summary"}`,
      content: result,
      subject: subject || "General",
      createdAt: new Date().toISOString(),
      metadata: { difficulty, length, tone, summaryType: mode === "summary" ? summaryType : undefined },
    };
    await addLibraryItem(item);
    setSaved(true);
    await checkAndAwardBadges();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (!aiConfig) {
    return (
      <View style={[styles.container, { paddingTop: topPad, justifyContent: "center", alignItems: "center" }]}>
        <LinearGradient colors={["#0A0E1A", "#121828"]} style={StyleSheet.absoluteFill} />
        <Ionicons name="key" size={48} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No AI Provider</Text>
        <Text style={styles.emptyText}>Set up your API key to generate content</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#0A0E1A", "#0A0E1A"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study Generator</Text>
        <View style={styles.modeToggle}>
          <Pressable
            style={[styles.modeBtn, mode === "notes" && styles.modeBtnActive]}
            onPress={() => { setMode("notes"); setResult(""); setSaved(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={[styles.modeBtnText, mode === "notes" && styles.modeBtnTextActive]}>Notes</Text>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, mode === "summary" && styles.modeBtnActive]}
            onPress={() => { setMode("summary"); setResult(""); setSaved(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={[styles.modeBtnText, mode === "summary" && styles.modeBtnTextActive]}>Summary</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputSection}>
          <Text style={styles.label}>Topic</Text>
          <TextInput
            style={styles.topicInput}
            placeholder={mode === "notes" ? "e.g. Newton's Laws of Motion" : "e.g. Photosynthesis"}
            placeholderTextColor={COLORS.textMuted}
            value={topic}
            onChangeText={setTopic}
            multiline={false}
          />

          <Text style={styles.label}>Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {(userProfile?.subjects || ["General"]).map((s) => (
              <Pressable
                key={s}
                style={[styles.chip, subject === s && styles.chipActive]}
                onPress={() => { setSubject(s); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {mode === "notes" ? (
          <View style={styles.optionsSection}>
            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.optionRow}>
              {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
                <Pressable
                  key={d}
                  style={[styles.optionBtn, difficulty === d && styles.optionBtnActive]}
                  onPress={() => { setDifficulty(d); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.optionText, difficulty === d && styles.optionTextActive]}>{d}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Length</Text>
            <View style={styles.optionRow}>
              {(["Short", "Medium", "Long"] as Length[]).map((l) => (
                <Pressable
                  key={l}
                  style={[styles.optionBtn, length === l && styles.optionBtnActive]}
                  onPress={() => { setLength(l); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.optionText, length === l && styles.optionTextActive]}>{l}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Tone</Text>
            <View style={styles.optionRow}>
              {(["Simple", "Academic", "Exam-Ready"] as Tone[]).map((t) => (
                <Pressable
                  key={t}
                  style={[styles.optionBtn, tone === t && styles.optionBtnActive]}
                  onPress={() => { setTone(t); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.optionText, tone === t && styles.optionTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.summaryTypesSection}>
            <Text style={styles.label}>Summary Type (8 types)</Text>
            <View style={styles.summaryGrid}>
              {SUMMARY_TYPES.map((st) => (
                <Pressable
                  key={st.id}
                  style={[styles.summaryTypeCard, summaryType === st.id && { borderColor: st.color, backgroundColor: st.color + "15" }]}
                  onPress={() => { setSummaryType(st.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <View style={[styles.summaryTypeIcon, { backgroundColor: st.color + "20" }]}>
                    <Ionicons name={st.icon as any} size={20} color={st.color} />
                  </View>
                  <Text style={[styles.summaryTypeText, summaryType === st.id && { color: st.color }]}>{st.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <Pressable
          style={[styles.generateBtn, (!topic.trim() || isGenerating) && styles.generateBtnDisabled]}
          onPress={generateContent}
          disabled={!topic.trim() || isGenerating}
        >
          <LinearGradient
            colors={topic.trim() ? COLORS.gradientPrimary : ["#2A3560", "#2A3560"]}
            style={styles.generateBtnGradient}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator color={COLORS.white} />
                <Text style={styles.generateBtnText}>Generating...</Text>
              </>
            ) : (
              <>
                <Ionicons name={mode === "notes" ? "document-text" : "list"} size={20} color={COLORS.white} />
                <Text style={styles.generateBtnText}>
                  {mode === "notes" ? "Generate Notes" : "Generate Summary"}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        {result ? (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                {mode === "notes" ? "Study Notes" : SUMMARY_TYPES.find(s => s.id === summaryType)?.label || "Summary"}
              </Text>
              <View style={styles.resultActions}>
                {!saved ? (
                  <Pressable style={styles.saveBtn} onPress={saveToLibrary}>
                    <Ionicons name="bookmark-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.saveBtnText}>Save</Text>
                  </Pressable>
                ) : (
                  <View style={styles.savedIndicator}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                    <Text style={styles.savedText}>Saved!</Text>
                  </View>
                )}
                <Pressable style={styles.regenBtn} onPress={generateContent}>
                  <Ionicons name="refresh" size={18} color={COLORS.textSecondary} />
                </Pressable>
              </View>
            </View>
            <ScrollView style={styles.resultScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              <Text style={styles.resultText}>{result}</Text>
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.text },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  modeBtnActive: { backgroundColor: COLORS.primary },
  modeBtnText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.textSecondary },
  modeBtnTextActive: { color: COLORS.white },

  inputSection: { paddingTop: 20 },
  label: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  topicInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  chipText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.primary },

  optionsSection: { marginTop: 8 },
  optionRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  optionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  optionBtnActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  optionText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.textSecondary },
  optionTextActive: { color: COLORS.primary },

  summaryTypesSection: { marginTop: 8 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  summaryTypeCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summaryTypeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  summaryTypeText: { fontFamily: "Poppins_500Medium", fontSize: 12, color: COLORS.textSecondary, flex: 1 },

  generateBtn: { borderRadius: 16, overflow: "hidden", marginTop: 20, marginBottom: 16 },
  generateBtnDisabled: { opacity: 0.5 },
  generateBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  generateBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: COLORS.white },

  resultContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: COLORS.text, flex: 1 },
  resultActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  saveBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  saveBtnText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.primary },
  savedIndicator: { flexDirection: "row", alignItems: "center", gap: 4 },
  savedText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: COLORS.success },
  regenBtn: { padding: 4 },
  resultScroll: { maxHeight: 500 },
  resultText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.text, lineHeight: 22, padding: 16 },

  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.text, marginTop: 16 },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary },
});
