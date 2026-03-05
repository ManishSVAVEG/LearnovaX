import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import * as Crypto from "expo-crypto";
import { storage, UserProfile, AIConfig, StudyStats, LibraryItem, ExamResult, ScheduleItem, ChatMessage, UserAuth } from "@/lib/storage";
import { BADGES } from "@/constants/badges";

interface AppContextValue {
  isLoading: boolean;
  isOnboarded: boolean;
  isLoggedIn: boolean;
  user: UserAuth | null;
  hasAIConfig: boolean;
  userProfile: UserProfile | null;
  aiConfig: AIConfig | null;
  stats: StudyStats | null;
  library: LibraryItem[];
  chatHistory: ChatMessage[];
  examResults: ExamResult[];
  schedule: ScheduleItem[];
  newBadge: string | null;

  login: (email: string, pass: string) => Promise<boolean>;
  signup: (email: string, user: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setOnboarded: (profile: UserProfile) => Promise<void>;
  setAIConfig: (config: AIConfig) => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
  refreshChatHistory: () => Promise<void>;
  refreshExamResults: () => Promise<void>;
  refreshSchedule: () => Promise<void>;
  addLibraryItem: (item: LibraryItem) => Promise<void>;
  removeLibraryItem: (id: string) => Promise<void>;
  setChatHistory: (msgs: ChatMessage[]) => Promise<void>;
  addExamResult: (result: ExamResult) => Promise<void>;
  addScheduleItem: (item: ScheduleItem) => Promise<void>;
  updateScheduleItem: (id: string, updates: Partial<ScheduleItem>) => Promise<void>;
  removeScheduleItem: (id: string) => Promise<void>;
  incrementStat: (key: keyof StudyStats, by?: number) => Promise<void>;
  updateStats: (updates: Partial<StudyStats>) => Promise<void>;
  trackSummaryType: (summaryType: string) => Promise<void>;
  checkAndAwardBadges: () => Promise<void>;
  dismissBadge: () => void;
  updateStreak: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserAuth | null>(null);
  const [hasAIConfig, setHasAIConfig] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [aiConfig, setAIConfigState] = useState<AIConfig | null>(null);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [chatHistory, setChatHistoryState] = useState<ChatMessage[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [newBadge, setNewBadge] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [onboarded, profile, config, st, lib, chat, exams, sched, loggedIn, currentUser] = await Promise.all([
        storage.isOnboarded(),
        storage.getUserProfile(),
        storage.getAIConfig(),
        storage.getStats(),
        storage.getLibrary(),
        storage.getChatHistory(),
        storage.getExamResults(),
        storage.getSchedule(),
        storage.isLoggedIn(),
        storage.getCurrentUser(),
      ]);
      setIsOnboarded(onboarded);
      setUserProfile(profile);
      setAIConfigState(config);
      setHasAIConfig(config?.isValidated === true);
      setStats(st);
      setLibrary(lib);
      setChatHistoryState(chat);
      setExamResults(exams);
      setSchedule(sched);
      setIsLoggedIn(loggedIn);
      setUser(currentUser);
    } finally {
      setIsLoading(false);
    }
  }

  const login = useCallback(async (email: string, pass: string) => {
    try {
      const users = await storage.getUsers();
      console.log(`Attempting login for ${email}. Found ${users.length} users.`);
      const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pass);
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.passwordHash === hash);
      if (found) {
        await storage.setLoggedIn(true);
        await storage.setCurrentUser(found);
        setIsLoggedIn(true);
        setUser(found);
        return true;
      }
      console.log("User not found or password incorrect");
      return false;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  }, []);

  const signup = useCallback(async (email: string, username: string, pass: string) => {
    try {
      const users = await storage.getUsers();
      const normalizedEmail = email.toLowerCase().trim();
      if (users.find(u => u.email.toLowerCase() === normalizedEmail)) {
        throw new Error("User already exists with this email");
      }
      const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pass);
      const newUser: UserAuth = {
        id: Math.random().toString(36).substring(7),
        email: normalizedEmail,
        username,
        passwordHash: hash,
        createdAt: new Date().toISOString(),
      };
      await storage.saveUser(newUser);
      await storage.setLoggedIn(true);
      await storage.setCurrentUser(newUser);
      setIsLoggedIn(true);
      setUser(newUser);
      return true;
    } catch (err) {
      console.error("Signup error:", err);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await storage.logout();
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  const setOnboarded = useCallback(async (profile: UserProfile) => {
    await storage.setUserProfile(profile);
    await storage.setOnboarded(true);
    setUserProfile(profile);
    setIsOnboarded(true);
  }, []);

  const setAIConfig = useCallback(async (config: AIConfig) => {
    await storage.setAIConfig(config);
    setAIConfigState(config);
    setHasAIConfig(config.isValidated);

    const currentStats = await storage.getStats();
    if (!currentStats.providersUsed.includes(config.provider)) {
      const updated = [...currentStats.providersUsed, config.provider];
      await storage.updateStats({ providersUsed: updated });
      setStats({ ...currentStats, providersUsed: updated });
    }
  }, []);

  const refreshStats = useCallback(async () => {
    const st = await storage.getStats();
    setStats(st);
  }, []);

  const refreshLibrary = useCallback(async () => {
    const lib = await storage.getLibrary();
    setLibrary(lib);
  }, []);

  const refreshChatHistory = useCallback(async () => {
    const chat = await storage.getChatHistory();
    setChatHistoryState(chat);
  }, []);

  const refreshExamResults = useCallback(async () => {
    const exams = await storage.getExamResults();
    setExamResults(exams);
  }, []);

  const refreshSchedule = useCallback(async () => {
    const sched = await storage.getSchedule();
    setSchedule(sched);
  }, []);

  const addLibraryItem = useCallback(async (item: LibraryItem) => {
    await storage.addLibraryItem(item);
    await storage.incrementStat("librarySaved");
    setLibrary((prev) => [item, ...prev]);
    setStats((prev) => prev ? { ...prev, librarySaved: prev.librarySaved + 1 } : prev);
  }, []);

  const removeLibraryItem = useCallback(async (id: string) => {
    await storage.removeLibraryItem(id);
    setLibrary((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const setChatHistory = useCallback(async (msgs: ChatMessage[]) => {
    await storage.setChatHistory(msgs);
    setChatHistoryState(msgs);
  }, []);

  const addExamResult = useCallback(async (result: ExamResult) => {
    await storage.addExamResult(result);
    setExamResults((prev) => [result, ...prev]);
  }, []);

  const addScheduleItem = useCallback(async (item: ScheduleItem) => {
    await storage.addScheduleItem(item);
    setSchedule((prev) => [...prev, item]);
  }, []);

  const updateScheduleItem = useCallback(async (id: string, updates: Partial<ScheduleItem>) => {
    await storage.updateScheduleItem(id, updates);
    setSchedule((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }, []);

  const removeScheduleItem = useCallback(async (id: string) => {
    await storage.removeScheduleItem(id);
    setSchedule((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const incrementStat = useCallback(async (key: keyof StudyStats, by = 1) => {
    await storage.incrementStat(key, by);
    setStats((prev) => {
      if (!prev) return prev;
      const current = prev[key];
      if (typeof current === "number") {
        return { ...prev, [key]: current + by };
      }
      return prev;
    });
  }, []);

  const updateStats = useCallback(async (updates: Partial<StudyStats>) => {
    await storage.updateStats(updates);
    setStats((prev) => prev ? { ...prev, ...updates } : prev);
  }, []);

  const trackSummaryType = useCallback(async (summaryType: string) => {
    await storage.trackSummaryType(summaryType);
    const newStats = await storage.getStats();
    setStats(newStats);
  }, []);

  const updateStreak = useCallback(async () => {
    await storage.updateStreak();
    const newStats = await storage.getStats();
    setStats(newStats);
  }, []);

  const checkAndAwardBadges = useCallback(async () => {
    const s = await storage.getStats();
    const totalActivities = s.notesGenerated + s.summariesGenerated + s.examsCompleted + s.chatMessages;

    for (const badge of BADGES) {
      if (s.badges.includes(badge.id)) continue;
      let unlock = false;

      switch (badge.id) {
        // Notes
        case "first_note": unlock = s.notesGenerated >= 1; break;
        case "note_5": unlock = s.notesGenerated >= 5; break;
        case "note_collector": unlock = s.notesGenerated >= 10; break;
        case "note_25": unlock = s.notesGenerated >= 25; break;
        case "note_master": unlock = s.notesGenerated >= 50; break;
        case "note_legend": unlock = s.notesGenerated >= 100; break;
        case "note_200": unlock = s.notesGenerated >= 200; break;
        case "note_500": unlock = s.notesGenerated >= 500; break;

        // Summaries
        case "first_summary": unlock = s.summariesGenerated >= 1; break;
        case "summary_5": unlock = s.summariesGenerated >= 5; break;
        case "summary_10": unlock = s.summariesGenerated >= 10; break;
        case "summary_pro": unlock = s.summariesGenerated >= 20; break;
        case "summary_50": unlock = s.summariesGenerated >= 50; break;
        case "summary_100": unlock = s.summariesGenerated >= 100; break;
        case "crash_sheet_king": unlock = s.crashSheetsGenerated >= 5; break;
        case "crash_sheet_pro": unlock = s.crashSheetsGenerated >= 15; break;
        case "crash_expert": unlock = s.crashSheetsGenerated >= 10; break;
        case "formula_master": unlock = s.formulaExtractions >= 10; break;

        // Definition & Memory
        case "definition_scholar": unlock = s.definitionSets >= 10; break;
        case "memory_champion": unlock = s.memoryTriggers >= 10; break;
        case "quick_revisor": unlock = s.quickRevisions >= 10; break;
        case "concept_king": unlock = s.conceptBreakdowns >= 10; break;
        case "summary_types_explorer": unlock = s.allSummaryTypesUsed >= 8; break;

        // Exams
        case "first_exam": unlock = s.examsCompleted >= 1; break;
        case "exam_5": unlock = s.examsCompleted >= 5; break;
        case "exam_warrior": unlock = s.examsCompleted >= 10; break;
        case "exam_25": unlock = s.examsCompleted >= 25; break;
        case "exam_50": unlock = s.examsCompleted >= 50; break;
        case "exam_100": unlock = s.examsCompleted >= 100; break;
        case "perfect_score": unlock = s.perfectScores >= 1; break;
        case "perfect_3": unlock = s.perfectScores >= 3; break;
        case "five_star_student": unlock = s.perfectScores >= 5; break;
        case "top_scorer": unlock = s.highScores >= 5; break;
        case "top_10_scores": unlock = s.highScores >= 10; break;

        // Chat
        case "first_chat": unlock = s.chatMessages >= 1; break;
        case "chat_10": unlock = s.chatMessages >= 10; break;
        case "chatterbox": unlock = s.chatMessages >= 50; break;
        case "chat_100": unlock = s.chatMessages >= 100; break;
        case "ai_whisperer": unlock = s.chatMessages >= 200; break;
        case "ai_master": unlock = s.chatMessages >= 500; break;
        case "ai_grandmaster": unlock = s.chatMessages >= 1000; break;
        case "ai_legend": unlock = s.chatMessages >= 2000; break;

        // Streak
        case "streak_3": unlock = s.streak >= 3; break;
        case "streak_7": unlock = s.streak >= 7; break;
        case "streak_14": unlock = s.streak >= 14; break;
        case "streak_21": unlock = s.streak >= 21; break;
        case "streak_30": unlock = s.streak >= 30; break;
        case "streak_60": unlock = s.streak >= 60; break;
        case "streak_100": unlock = s.streak >= 100; break;
        case "streak_365": unlock = s.streak >= 365; break;
        case "perfect_week": unlock = s.streak >= 7; break;

        // Library
        case "first_save": unlock = s.librarySaved >= 1; break;
        case "library_5": unlock = s.librarySaved >= 5; break;
        case "librarian": unlock = s.librarySaved >= 20; break;
        case "knowledge_vault": unlock = s.librarySaved >= 50; break;
        case "library_100": unlock = s.librarySaved >= 100; break;
        case "library_200": unlock = s.librarySaved >= 200; break;

        // Subjects
        case "first_subject": unlock = s.subjectsStudied.length >= 1; break;
        case "subject_2": unlock = s.subjectsStudied.length >= 2; break;
        case "multi_subject": unlock = s.subjectsStudied.length >= 3; break;
        case "polymath": unlock = s.subjectsStudied.length >= 5; break;
        case "subject_10": unlock = s.subjectsStudied.length >= 10; break;

        // Accuracy
        case "accuracy_50": unlock = s.accuracy >= 50 && s.examsCompleted >= 1; break;
        case "accuracy_60": unlock = s.accuracy >= 60 && s.examsCompleted >= 1; break;
        case "accuracy_70": unlock = s.accuracy >= 70 && s.examsCompleted >= 1; break;
        case "accuracy_75": unlock = s.accuracy >= 75 && s.examsCompleted >= 1; break;
        case "accuracy_85": unlock = s.accuracy >= 85 && s.examsCompleted >= 1; break;
        case "accuracy_95": unlock = s.accuracy >= 95 && s.examsCompleted >= 1; break;

        // Time
        case "early_bird": unlock = s.earlyBirdSessions >= 1; break;
        case "early_bird_5": unlock = s.earlyBirdSessions >= 5; break;
        case "night_owl": unlock = s.nightOwlSessions >= 1; break;
        case "night_owl_5": unlock = s.nightOwlSessions >= 5; break;

        // Speed & Comeback
        case "speed_demon": unlock = s.speedExams >= 1; break;
        case "speed_5": unlock = s.speedExams >= 5; break;
        case "comeback_kid": unlock = s.comebacks >= 1; break;
        case "comeback_5": unlock = s.comebacks >= 5; break;

        // AI Provider
        case "ai_powered": unlock = s.providersUsed.length >= 1; break;
        case "ai_explorer": unlock = s.providersUsed.length >= 2; break;
        case "ai_trilingual": unlock = s.providersUsed.length >= 3; break;
        case "ai_connoisseur": unlock = s.providersUsed.length >= 4; break;

        // Schedule
        case "first_scheduled": unlock = s.scheduledCompleted >= 1; break;
        case "schedule_5": unlock = s.scheduledCompleted >= 5; break;
        case "schedule_20": unlock = s.scheduledCompleted >= 20; break;
        case "schedule_50": unlock = s.scheduledCompleted >= 50; break;

        // Combos & Milestones
        case "full_scholar": unlock = s.notesGenerated >= 1 && s.summariesGenerated >= 1 && s.examsCompleted >= 1 && s.chatMessages >= 1; break;
        case "note_summary_combo": unlock = s.notesGenerated >= 10 && s.summariesGenerated >= 10; break;
        case "study_machine": unlock = totalActivities >= 100; break;
        case "ultimate_scholar": unlock = totalActivities >= 500; break;
        case "legend_status": unlock = totalActivities >= 1000; break;
        case "daily_balance": unlock = s.earlyBirdSessions >= 1 && s.nightOwlSessions >= 1; break;
        case "balanced_student": unlock = s.notesGenerated >= 25 && s.summariesGenerated >= 25 && s.examsCompleted >= 25; break;
        case "master_all": unlock = s.notesGenerated >= 100 && s.summariesGenerated >= 100 && s.examsCompleted >= 100; break;
        case "week_achiever": unlock = s.streak >= 7 && s.examsCompleted >= 10; break;
        case "knowledge_seeker": unlock = s.subjectsStudied.length >= 3 && s.notesGenerated >= 10; break;
        case "exam_chat_combo": unlock = s.examsCompleted >= 50 && s.chatMessages >= 200; break;
        case "century_club": unlock = s.notesGenerated >= 100 && s.examsCompleted >= 100; break;
        case "note_library_combo": unlock = s.notesGenerated >= 50 && s.librarySaved >= 50; break;
        case "streak_exam_hero": unlock = s.streak >= 30 && s.examsCompleted >= 50; break;
        case "weakness_fighter": unlock = s.weaknessSummaries >= 5; break;
      }

      if (unlock) {
        const awarded = await storage.addBadge(badge.id);
        if (awarded) {
          setNewBadge(badge.id);
          setStats((prev) => prev ? { ...prev, badges: [...prev.badges, badge.id] } : prev);
          break;
        }
      }
    }
  }, []);

  const dismissBadge = useCallback(() => setNewBadge(null), []);

  const value = useMemo<AppContextValue>(
    () => ({
      isLoading, isOnboarded, isLoggedIn, user, hasAIConfig, userProfile, aiConfig, stats,
      library, chatHistory, examResults, schedule, newBadge,
      login, signup, logout, setOnboarded, setAIConfig, refreshStats, refreshLibrary,
      refreshChatHistory, refreshExamResults, refreshSchedule,
      addLibraryItem, removeLibraryItem, setChatHistory, addExamResult,
      addScheduleItem, updateScheduleItem, removeScheduleItem,
      incrementStat, updateStats, trackSummaryType, checkAndAwardBadges, dismissBadge, updateStreak,
    }),
    [
      isLoading, isOnboarded, isLoggedIn, user, hasAIConfig, userProfile, aiConfig, stats,
      library, chatHistory, examResults, schedule, newBadge,
      login, signup, logout, setOnboarded, setAIConfig, refreshStats, refreshLibrary,
      refreshChatHistory, refreshExamResults, refreshSchedule,
      addScheduleItem, updateScheduleItem, removeScheduleItem,
      incrementStat, updateStats, trackSummaryType, checkAndAwardBadges, dismissBadge, updateStreak,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
