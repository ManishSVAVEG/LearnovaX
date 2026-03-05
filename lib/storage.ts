import AsyncStorage from "@react-native-async-storage/async-storage";
import { encryptAPIKey, decryptAPIKey } from "./encryption";

const KEYS = {
  USER_PROFILE: "aibuddy_user_profile",
  AI_CONFIG: "aibuddy_ai_config",
  AI_CONFIG_ENCRYPTED: "aibuddy_ai_config_encrypted",
  LIBRARY: "aibuddy_library",
  CHAT_HISTORY: "aibuddy_chat_history",
  STATS: "aibuddy_stats",
  EXAM_RESULTS: "aibuddy_exam_results",
  SCHEDULE: "aibuddy_schedule",
  ONBOARDED: "aibuddy_onboarded",
  LAST_BACKUP: "aibuddy_last_backup",
  USERS: "aibuddy_users",
  CURRENT_USER_ID: "aibuddy_current_user_id",
  IS_LOGGED_IN: "aibuddy_is_logged_in",
};

export interface UserAuth {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface UserProfile {
  username: string;
  country: string;
  board: string;
  grade: string;
  subjects: string[];
  createdAt: string;
}

export interface AIConfig {
  provider: "openai" | "gemini" | "groq" | "anthropic";
  apiKey: string;
  model: string;
  isValidated: boolean;
}

export interface LibraryItem {
  id: string;
  type: "note" | "summary" | "exam";
  title: string;
  content: string;
  subject: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface StudyStats {
  notesGenerated: number;
  summariesGenerated: number;
  examsCompleted: number;
  chatMessages: number;
  studyMinutes: number;
  accuracy: number;
  weeklyData: number[];
  badges: string[];
  streak: number;
  lastStudyDate: string;
  perfectScores: number;
  highScores: number;
  librarySaved: number;
  subjectsStudied: string[];
  providersUsed: string[];
  crashSheetsGenerated: number;
  earlyBirdSessions: number;
  nightOwlSessions: number;
  speedExams: number;
  comebacks: number;
  // Extended stats for 100 badges
  formulaExtractions: number;
  definitionSets: number;
  memoryTriggers: number;
  quickRevisions: number;
  conceptBreakdowns: number;
  weaknessSummaries: number;
  scheduledCompleted: number;
  allSummaryTypesUsed: number;
  summaryTypesUsedSet: string[];
}

export interface ExamResult {
  id: string;
  subject: string;
  topic: string;
  totalMarks: number;
  scoredMarks: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: string;
  questions: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    score: number;
    maxScore: number;
    explanation: string;
  }[];
}

export interface ScheduleItem {
  id: string;
  subject: string;
  topic: string;
  date: string;
  duration: number;
  completed: boolean;
  missed: boolean;
}

const DEFAULT_STATS: StudyStats = {
  notesGenerated: 0,
  summariesGenerated: 0,
  examsCompleted: 0,
  chatMessages: 0,
  studyMinutes: 0,
  accuracy: 0,
  weeklyData: [0, 0, 0, 0, 0, 0, 0],
  badges: [],
  streak: 0,
  lastStudyDate: "",
  perfectScores: 0,
  highScores: 0,
  librarySaved: 0,
  subjectsStudied: [],
  providersUsed: [],
  crashSheetsGenerated: 0,
  earlyBirdSessions: 0,
  nightOwlSessions: 0,
  speedExams: 0,
  comebacks: 0,
  formulaExtractions: 0,
  definitionSets: 0,
  memoryTriggers: 0,
  quickRevisions: 0,
  conceptBreakdowns: 0,
  weaknessSummaries: 0,
  scheduledCompleted: 0,
  allSummaryTypesUsed: 0,
  summaryTypesUsedSet: [],
};

async function get<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;

    // Recovery for corrupted array data (object instead of array)
    if (Array.isArray(fallback) && parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      console.warn(`Storage key "${key}" expected array but got object. Attempting recovery.`);
      return Object.values(parsed) as unknown as T;
    }

    // Merge with fallback to handle missing fields from old saves
    // Only merge if both are plain objects (not arrays)
    if (
      typeof parsed === "object" && 
      parsed !== null && 
      !Array.isArray(parsed) &&
      typeof fallback === "object" && 
      fallback !== null &&
      !Array.isArray(fallback)
    ) {
      return { ...fallback, ...parsed } as T;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

async function set<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/**
 * Secure set with encryption for sensitive data
 */
async function setSecure<T extends { apiKey?: string }>(key: string, value: T): Promise<void> {
  if (value.apiKey) {
    const encrypted = await encryptAPIKey(value.apiKey);
    const secured = { ...value, apiKey: encrypted };
    await AsyncStorage.setItem(key, JSON.stringify(secured));
  } else {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }
}

/**
 * Secure get with decryption for sensitive data
 */
async function getSecure<T extends { apiKey?: string } | null>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    
    // Decrypt API key if present
    if (parsed && typeof parsed === "object" && "apiKey" in parsed && (parsed as any).apiKey && typeof (parsed as any).apiKey === "string") {
      try {
        const decrypted = await decryptAPIKey((parsed as any).apiKey);
        const decryptedConfig = { ...parsed, apiKey: decrypted } as T;
        
        // Merge with fallback to handle missing fields
        if (
          decryptedConfig && 
          typeof decryptedConfig === "object" && 
          !Array.isArray(decryptedConfig) &&
          fallback && 
          typeof fallback === "object" && 
          !Array.isArray(fallback)
        ) {
          return { ...fallback, ...decryptedConfig } as T;
        }
        return decryptedConfig;
      } catch (err) {
        console.warn("Failed to decrypt API key, using as-is");
      }
    }
    
    // Merge with fallback to handle missing fields
    if (
      typeof parsed === "object" && 
      parsed !== null && 
      !Array.isArray(parsed) &&
      typeof fallback === "object" && 
      fallback !== null &&
      !Array.isArray(fallback)
    ) {
      return { ...fallback, ...parsed } as T;
    }
    return parsed;
  } catch (err) {
    console.error("Storage retrieval error:", err);
    return fallback;
  }
}

export const storage = {
  isOnboarded: () => get<boolean>(KEYS.ONBOARDED, false),
  setOnboarded: (v: boolean) => set(KEYS.ONBOARDED, v),

  getUserProfile: () => get<UserProfile | null>(KEYS.USER_PROFILE, null),
  setUserProfile: (p: UserProfile) => set(KEYS.USER_PROFILE, p),

  // Secure AI Config storage with encryption
  getAIConfig: async () => {
    const config = await getSecure<AIConfig | null>(KEYS.AI_CONFIG, null);
    return config;
  },
  setAIConfig: (c: AIConfig) => setSecure(KEYS.AI_CONFIG, c),

  getLibrary: () => get<LibraryItem[]>(KEYS.LIBRARY, []),
  addLibraryItem: async (item: LibraryItem) => {
    const lib = await get<LibraryItem[]>(KEYS.LIBRARY, []);
    await set(KEYS.LIBRARY, [item, ...lib]);
  },
  removeLibraryItem: async (id: string) => {
    const lib = await get<LibraryItem[]>(KEYS.LIBRARY, []);
    await set(KEYS.LIBRARY, lib.filter((i) => i.id !== id));
  },

  getChatHistory: () => get<ChatMessage[]>(KEYS.CHAT_HISTORY, []),
  setChatHistory: (msgs: ChatMessage[]) => set(KEYS.CHAT_HISTORY, msgs),

  getStats: () => get<StudyStats>(KEYS.STATS, DEFAULT_STATS),
  updateStats: async (updates: Partial<StudyStats>) => {
    const stats = await get<StudyStats>(KEYS.STATS, DEFAULT_STATS);
    await set(KEYS.STATS, { ...stats, ...updates });
  },
  incrementStat: async (key: keyof StudyStats, by = 1) => {
    const stats = await get<StudyStats>(KEYS.STATS, DEFAULT_STATS);
    const current = stats[key];
    if (typeof current === "number") {
      await set(KEYS.STATS, { ...stats, [key]: current + by });
    }
  },
  trackSummaryType: async (summaryType: string) => {
    const stats = await get<StudyStats>(KEYS.STATS, DEFAULT_STATS);
    const used = stats.summaryTypesUsedSet || [];
    if (!used.includes(summaryType)) {
      const newUsed = [...used, summaryType];
      await set(KEYS.STATS, {
        ...stats,
        summaryTypesUsedSet: newUsed,
        allSummaryTypesUsed: newUsed.length,
      });
    }
  },

  getExamResults: () => get<ExamResult[]>(KEYS.EXAM_RESULTS, []),
  addExamResult: async (result: ExamResult) => {
    const results = await get<ExamResult[]>(KEYS.EXAM_RESULTS, []);
    await set(KEYS.EXAM_RESULTS, [result, ...results]);
  },

  getSchedule: () => get<ScheduleItem[]>(KEYS.SCHEDULE, []),
  addScheduleItem: async (item: ScheduleItem) => {
    const schedule = await get<ScheduleItem[]>(KEYS.SCHEDULE, []);
    await set(KEYS.SCHEDULE, [...schedule, item]);
  },
  updateScheduleItem: async (id: string, updates: Partial<ScheduleItem>) => {
    const schedule = await get<ScheduleItem[]>(KEYS.SCHEDULE, []);
    await set(
      KEYS.SCHEDULE,
      schedule.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  },
  removeScheduleItem: async (id: string) => {
    const schedule = await get<ScheduleItem[]>(KEYS.SCHEDULE, []);
    await set(KEYS.SCHEDULE, schedule.filter((i) => i.id !== id));
  },

  updateStreak: async () => {
    const stats = await get<StudyStats>(KEYS.STATS, DEFAULT_STATS);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let streak = stats.streak;
    if (stats.lastStudyDate === today) return streak;
    if (stats.lastStudyDate === yesterday) {
      streak = streak + 1;
    } else {
      streak = 1;
    }
    const dayOfWeek = new Date().getDay();
    const weeklyData = [...(stats.weeklyData || [0, 0, 0, 0, 0, 0, 0])];
    weeklyData[dayOfWeek] = (weeklyData[dayOfWeek] || 0) + 1;
    await set(KEYS.STATS, { ...stats, streak, lastStudyDate: today, weeklyData });
    return streak;
  },

  addBadge: async (badgeId: string) => {
    const stats = await get<StudyStats>(KEYS.STATS, DEFAULT_STATS);
    if (!stats.badges.includes(badgeId)) {
      await set(KEYS.STATS, {
        ...stats,
        badges: [...stats.badges, badgeId],
      });
      return true;
    }
    return false;
  },

  // Auth Functions
  getUsers: () => get<UserAuth[]>(KEYS.USERS, []),
  saveUser: async (user: UserAuth) => {
    const users = await get<UserAuth[]>(KEYS.USERS, []);
    await set(KEYS.USERS, [...users, user]);
  },
  getCurrentUser: () => get<UserAuth | null>(KEYS.CURRENT_USER_ID, null),
  setCurrentUser: (user: UserAuth | null) => set(KEYS.CURRENT_USER_ID, user),
  isLoggedIn: () => get<boolean>(KEYS.IS_LOGGED_IN, false),
  setLoggedIn: (v: boolean) => set(KEYS.IS_LOGGED_IN, v),
  logout: async () => {
    await set(KEYS.IS_LOGGED_IN, false);
    await set(KEYS.CURRENT_USER_ID, null);
  },
};
