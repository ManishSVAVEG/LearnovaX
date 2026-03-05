import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
  Keyboard,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import COLORS from "@/constants/colors";
import { callAI, buildSystemPrompt } from "@/lib/ai";
import { ChatMessage } from "@/lib/storage";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

let msgCounter = 0;
function uniqueId() {
  msgCounter++;
  return `msg-${Date.now()}-${msgCounter}-${Math.random().toString(36).slice(2, 9)}`;
}

function TypingIndicator() {
  return (
    <View style={[styles.bubbleContainer, styles.bubbleContainerLeft]}>
      <View style={[styles.bubble, styles.bubbleLeft]}>
        <View style={styles.typingDots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, { opacity: 0.4 + i * 0.2 }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleContainer, isUser ? styles.bubbleContainerRight : styles.bubbleContainerLeft]}>
      {!isUser && (
        <View style={styles.avatarBg}>
          <Ionicons name="sparkles" size={14} color={COLORS.primary} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleRight : styles.bubbleLeft]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextRight : styles.bubbleTextLeft]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { aiConfig, userProfile, chatHistory, setChatHistory, incrementStat, checkAndAwardBadges, updateStats } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const inputRef = useRef<TextInput>(null);
  const initializedRef = useRef(false);
  const flatListRef = useRef<FlatList>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // Keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (chatHistory.length > 0 && !initializedRef.current) {
      setMessages(chatHistory);
      initializedRef.current = true;
    }
  }, [chatHistory]);

  // Auto-scroll for new messages
  useEffect(() => {
    if (messages.length > 0 && !showTyping) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [messages, showTyping]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming || !aiConfig) return;
    const text = input.trim();
    setInput("");
    inputRef.current?.focus();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentMessages = [...messages];
    const userMsg: ChatMessage = {
      id: uniqueId(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsStreaming(true);
    setShowTyping(true);

    try {
      await incrementStat("chatMessages");

      const systemPrompt = userProfile ? buildSystemPrompt(userProfile) : "You are a helpful study assistant.";
      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...currentMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: text },
      ];

      let fullContent = "";
      let assistantAdded = false;
      const assistantId = uniqueId();

      await callAI(aiConfig, apiMessages, (chunk) => {
        fullContent += chunk;
        if (!assistantAdded) {
          setShowTyping(false);
          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: "assistant", content: fullContent, timestamp: new Date().toISOString() },
          ]);
          assistantAdded = true;
        } else {
          setMessages((prev) => {
            const up = [...prev];
            up[up.length - 1] = { ...up[up.length - 1], content: fullContent };
            return up;
          });
        }
      });

      const finalMessages = [
        ...updated,
        { id: assistantId, role: "assistant" as const, content: fullContent, timestamp: new Date().toISOString() },
      ];
      await setChatHistory(finalMessages);
      await checkAndAwardBadges();

      const hour = new Date().getHours();
      if (hour < 8) await updateStats({ earlyBirdSessions: 1 });
      if (hour >= 22) await updateStats({ nightOwlSessions: 1 });
    } catch (err: any) {
      setShowTyping(false);
      const errMsg: ChatMessage = {
        id: uniqueId(),
        role: "assistant",
        content: `Error: ${err?.message || "Something went wrong. Check your API key and try again."}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
    }
  }, [input, isStreaming, aiConfig, messages, userProfile, incrementStat, setChatHistory, checkAndAwardBadges, updateStats]);

  const clearChat = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMessages([]);
    await setChatHistory([]);
    initializedRef.current = true;
  }, [setChatHistory]);

  const reversedMessages = [...messages].reverse();

  if (!aiConfig) {
    return (
      <View style={[styles.container, { paddingTop: topPad, justifyContent: "center", alignItems: "center" }]}>
        <LinearGradient colors={["#0A0E1A", "#121828"]} style={StyleSheet.absoluteFill} />
        <Ionicons name="key" size={48} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No AI Provider</Text>
        <Text style={styles.emptyText}>Set up your API key to start chatting</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={["#0A0E1A", "#0A0E1A"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={COLORS.gradientPrimary} style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={20} color={COLORS.white} />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSub}>Syllabus-aligned responses</Text>
          </View>
        </View>
        <Pressable onPress={clearChat} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={20} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient colors={COLORS.gradientPrimary} style={styles.emptyIcon}>
            <Ionicons name="chatbubbles" size={36} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>Ask Me Anything</Text>
          <Text style={styles.emptyText}>
            I'm aligned to {userProfile?.board || "your curriculum"} for {userProfile?.grade || "your grade"}
          </Text>
          <View style={styles.suggestionsContainer}>
            {[
              "Explain Newton's laws of motion",
              "Help me with quadratic equations",
              "What is photosynthesis?",
              "Summarize the causes of WW1",
            ].map((s) => (
              <Pressable
                key={s}
                style={styles.suggestion}
                onPress={() => { setInput(s); inputRef.current?.focus(); }}
              >
                <Text style={styles.suggestionText}>{s}</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={reversedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          inverted={messages.length > 0}
          ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 🔥 BADA INPUT BAR - ChatGPT style */}
      <View style={[
        styles.inputContainer, 
        { 
          paddingBottom: keyboardVisible 
            ? keyboardHeight + 20  // Extra space for better visibility
            : insets.bottom + 16,
        }
      ]}>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Ask anything about your subjects..."
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            blurOnSubmit={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            // 🔥 Text size bada kiya
            textAlignVertical="center"
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || isStreaming) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            {isStreaming ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="send" size={22} color={COLORS.white} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: COLORS.text },
  headerSub: { fontFamily: "Poppins_400Regular", fontSize: 11, color: COLORS.textSecondary },
  clearBtn: { padding: 8 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: COLORS.text },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  suggestionsContainer: { width: "100%", gap: 8, marginTop: 16 },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: COLORS.textSecondary, flex: 1 },

  bubbleContainer: { marginVertical: 4, maxWidth: "80%", flexDirection: "row", alignItems: "flex-end", gap: 8 },
  bubbleContainerLeft: { alignSelf: "flex-start" },
  bubbleContainerRight: { alignSelf: "flex-end" },
  avatarBg: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primaryGlow, alignItems: "center", justifyContent: "center" },
  bubble: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, maxWidth: "100%" },
  bubbleLeft: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  bubbleRight: { borderBottomRightRadius: 4, backgroundColor: COLORS.primary },
  bubbleText: { fontFamily: "Poppins_400Regular", fontSize: 15, lineHeight: 22 },
  bubbleTextLeft: { color: COLORS.text },
  bubbleTextRight: { color: COLORS.white },

  typingDots: { flexDirection: "row", gap: 4, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.textSecondary },

  // 🔥 INPUT BAR - BADA AUR COMFORTABLE
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.bg,
    // Extra shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
  },
  inputRow: { 
    flexDirection: "row", 
    alignItems: "flex-end", 
    gap: 12, // Gap bada kiya
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24, // Zyada rounded
    paddingHorizontal: 20, // Horizontal padding bada
    paddingVertical: 20, // Vertical padding bada - ChatGPT style
    fontFamily: "Poppins_400Regular",
    fontSize: 16, // Font size bada
    color: COLORS.text,
    maxHeight: 120,
    minHeight: 52, // Minimum height fix
  },
  sendBtn: {
    width: 52, // Bada button
    height: 52, // Bada button
    borderRadius: 26, // Perfect circle
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    // Shadow for depth
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sendBtnDisabled: { 
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
  },
});