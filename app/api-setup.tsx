import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import COLORS from "@/constants/colors";
import { AIConfig } from "@/lib/storage";
import { AI_PROVIDERS, ProviderKey, validateAPIKey } from "@/lib/ai";

export default function APISetupScreen() {
  const insets = useSafeAreaInsets();
  const { setAIConfig } = useApp();
  const [provider, setProvider] = useState<ProviderKey>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(AI_PROVIDERS.openai.models[0].id);
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [validated, setValidated] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const selectProvider = (p: ProviderKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProvider(p);
    setModel(AI_PROVIDERS[p].models[0].id);
    setApiKey("");
    setValidationError("");
    setValidated(false);
  };

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      setValidationError("Please enter your API key");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsValidating(true);
    setValidationError("");
    try {
      const config: AIConfig = { provider, apiKey: apiKey.trim(), model, isValidated: false };
      const ok = await validateAPIKey(config);
      if (ok) {
        setValidated(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await setAIConfig({ ...config, isValidated: true });
        setTimeout(() => router.replace("/(tabs)"), 800);
      } else {
        setValidationError("Invalid API key or model not accessible. Please check and try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e: any) {
      setValidationError(e?.message || "Validation failed. Check your key and internet connection.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsValidating(false);
    }
  };

  const providerInfo = AI_PROVIDERS[provider];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#0A0E1A", "#121828"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <LinearGradient colors={COLORS.gradientPrimary} style={styles.iconCircle}>
            <Ionicons name="key" size={36} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.title}>AI Provider Setup</Text>
          <Text style={styles.subtitle}>
            Enter your own API key. Your key is stored encrypted on-device — never sent to our servers.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Choose Your AI Provider</Text>
        <View style={styles.providerGrid}>
          {(Object.keys(AI_PROVIDERS) as ProviderKey[]).map((p) => {
            const info = AI_PROVIDERS[p];
            const isSelected = provider === p;
            return (
              <Pressable
                key={p}
                style={[styles.providerCard, isSelected && styles.providerCardSelected]}
                onPress={() => selectProvider(p)}
              >
                <View style={[styles.providerIconBg, { backgroundColor: info.color + "20" }]}>
                  <Ionicons name={info.icon as any} size={24} color={info.color} />
                </View>
                <Text style={[styles.providerName, isSelected && { color: COLORS.primary }]}>
                  {info.name}
                </Text>
                <Text style={styles.providerModels}>{info.models.length} models</Text>
                {isSelected && (
                  <View style={styles.selectedCheck}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Select Model</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modelScroll}>
          {providerInfo.models.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.modelChip, model === m.id && styles.modelChipSelected]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setModel(m.id); }}
            >
              <Text style={[styles.modelChipTitle, model === m.id && { color: COLORS.primary }]}>
                {m.displayName}
              </Text>
              <Text style={styles.modelChipDesc}>{m.description}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Your API Key</Text>
        <View style={styles.keyInputContainer}>
          <TextInput
            style={styles.keyInput}
            placeholder={`Enter your ${providerInfo.name} API key`}
            placeholderTextColor={COLORS.textMuted}
            value={apiKey}
            onChangeText={(t) => { setApiKey(t); setValidationError(""); setValidated(false); }}
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.eyeBtn} onPress={() => setShowKey((v) => !v)}>
            <Ionicons name={showKey ? "eye-off" : "eye"} size={20} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.howToGet}>
          <Ionicons name="information-circle" size={16} color={COLORS.textMuted} />
          <Text style={styles.howToGetText}>
            {provider === "openai" && "Get your key at platform.openai.com → API Keys"}
            {provider === "gemini" && "Get your key at aistudio.google.com → Get API Key"}
            {provider === "groq" && "Get your key at console.groq.com → API Keys"}
            {provider === "anthropic" && "Get your key at console.anthropic.com → API Keys"}
          </Text>
        </View>

        {validationError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
            <Text style={styles.errorText}>{validationError}</Text>
          </View>
        ) : null}

        {validated ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.successText}>API key validated! Redirecting...</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.validateBtn, (!apiKey.trim() || isValidating) && styles.validateBtnDisabled]}
          onPress={handleValidate}
          disabled={!apiKey.trim() || isValidating}
        >
          <LinearGradient
            colors={apiKey.trim() ? COLORS.gradientPrimary : ["#2A3560", "#2A3560"]}
            style={styles.validateBtnGradient}
          >
            {isValidating ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.white} />
                <Text style={styles.validateBtnText}>Validate & Save Key</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        <View style={styles.securityNote}>
          <Ionicons name="lock-closed" size={14} color={COLORS.textMuted} />
          <Text style={styles.securityNoteText}>
            Your API key is stored securely on your device only. We never transmit your key to any server.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 20 },
  headerSection: { alignItems: "center", paddingTop: 20, paddingBottom: 32 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 26, color: COLORS.text, textAlign: "center", marginBottom: 8 },
  subtitle: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 20 },

  sectionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },

  providerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  providerCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  providerCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  providerIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  providerName: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.text, textAlign: "center" },
  providerModels: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },
  selectedCheck: { position: "absolute", top: 8, right: 8 },

  modelScroll: { marginBottom: 24 },
  modelChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginRight: 10,
    minWidth: 140,
  },
  modelChipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  modelChipTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: COLORS.text, marginBottom: 2 },
  modelChipDesc: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted },

  keyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    marginBottom: 10,
  },
  keyInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: COLORS.text,
  },
  eyeBtn: { padding: 16 },

  howToGet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  howToGetText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: COLORS.textMuted, flex: 1 },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: COLORS.dangerGlow,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.danger, flex: 1 },

  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.successGlow,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  successText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.success },

  validateBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  validateBtnDisabled: { opacity: 0.5 },
  validateBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  validateBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: COLORS.white },

  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
  },
  securityNoteText: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textMuted, flex: 1, lineHeight: 16 },
});
