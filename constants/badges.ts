export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Elite";
  category: string;
  progressRequired: number;
  unlockCondition: string;
}

export const BADGES: Badge[] = [
  // ── NOTES (8) ──────────────────────────────────────────────────────────────
  { id: "first_note", name: "First Scholar", description: "Generate your first study note", icon: "document-text", color: "#4F8EF7", difficulty: "Easy", category: "Notes", progressRequired: 1, unlockCondition: "notesGenerated >= 1" },
  { id: "note_5", name: "Note Starter", description: "Generate 5 study notes", icon: "document-text-outline", color: "#4F8EF7", difficulty: "Easy", category: "Notes", progressRequired: 5, unlockCondition: "notesGenerated >= 5" },
  { id: "note_collector", name: "Note Collector", description: "Generate 10 study notes", icon: "documents", color: "#4F8EF7", difficulty: "Easy", category: "Notes", progressRequired: 10, unlockCondition: "notesGenerated >= 10" },
  { id: "note_25", name: "Note Builder", description: "Generate 25 study notes", icon: "documents-outline", color: "#4F8EF7", difficulty: "Medium", category: "Notes", progressRequired: 25, unlockCondition: "notesGenerated >= 25" },
  { id: "note_master", name: "Note Master", description: "Generate 50 study notes", icon: "library", color: "#7B5EF8", difficulty: "Hard", category: "Notes", progressRequired: 50, unlockCondition: "notesGenerated >= 50" },
  { id: "note_legend", name: "Note Legend", description: "Generate 100 study notes", icon: "trophy", color: "#F5C842", difficulty: "Elite", category: "Notes", progressRequired: 100, unlockCondition: "notesGenerated >= 100" },
  { id: "note_200", name: "Note Encyclopedia", description: "Generate 200 study notes", icon: "book", color: "#F5C842", difficulty: "Elite", category: "Notes", progressRequired: 200, unlockCondition: "notesGenerated >= 200" },
  { id: "note_500", name: "Knowledge God", description: "Generate 500 study notes", icon: "globe", color: "#F5C842", difficulty: "Elite", category: "Notes", progressRequired: 500, unlockCondition: "notesGenerated >= 500" },

  // ── SUMMARIES (9) ──────────────────────────────────────────────────────────
  { id: "first_summary", name: "Summarizer", description: "Generate your first summary", icon: "list", color: "#00D4AA", difficulty: "Easy", category: "Summaries", progressRequired: 1, unlockCondition: "summariesGenerated >= 1" },
  { id: "summary_5", name: "Summary Starter", description: "Generate 5 summaries", icon: "list-outline", color: "#00D4AA", difficulty: "Easy", category: "Summaries", progressRequired: 5, unlockCondition: "summariesGenerated >= 5" },
  { id: "summary_10", name: "Summary Writer", description: "Generate 10 summaries", icon: "reader-outline", color: "#00D4AA", difficulty: "Easy", category: "Summaries", progressRequired: 10, unlockCondition: "summariesGenerated >= 10" },
  { id: "summary_pro", name: "Summary Pro", description: "Generate 20 summaries", icon: "reader", color: "#00D4AA", difficulty: "Medium", category: "Summaries", progressRequired: 20, unlockCondition: "summariesGenerated >= 20" },
  { id: "summary_50", name: "Summary Expert", description: "Generate 50 summaries", icon: "layers", color: "#00D4AA", difficulty: "Hard", category: "Summaries", progressRequired: 50, unlockCondition: "summariesGenerated >= 50" },
  { id: "summary_100", name: "Summary Legend", description: "Generate 100 summaries", icon: "layers-outline", color: "#F5C842", difficulty: "Elite", category: "Summaries", progressRequired: 100, unlockCondition: "summariesGenerated >= 100" },
  { id: "crash_sheet_king", name: "Crash Sheet King", description: "Generate 5 crash sheets", icon: "flash", color: "#FFB340", difficulty: "Medium", category: "Summaries", progressRequired: 5, unlockCondition: "crashSheetsGenerated >= 5" },
  { id: "crash_sheet_pro", name: "Crash Sheet Pro", description: "Generate 15 crash sheets", icon: "flash-outline", color: "#FFB340", difficulty: "Hard", category: "Summaries", progressRequired: 15, unlockCondition: "crashSheetsGenerated >= 15" },
  { id: "formula_master", name: "Formula Master", description: "Extract formulas 10 times", icon: "calculator", color: "#F5C842", difficulty: "Medium", category: "Summaries", progressRequired: 10, unlockCondition: "formulaExtractions >= 10" },

  // ── DEFINITION & MEMORY (4) ────────────────────────────────────────────────
  { id: "definition_scholar", name: "Dictionary Mind", description: "Use Definition Mode 10 times", icon: "book-outline", color: "#FF6B35", difficulty: "Medium", category: "Summaries", progressRequired: 10, unlockCondition: "definitionSets >= 10" },
  { id: "memory_champion", name: "Memory Champion", description: "Use Memory Trigger Mode 10 times", icon: "bulb", color: "#7B5EF8", difficulty: "Medium", category: "Summaries", progressRequired: 10, unlockCondition: "memoryTriggers >= 10" },
  { id: "quick_revisor", name: "Quick Revisor", description: "Use Ultra Quick Revision 10 times", icon: "timer", color: "#FF4D6A", difficulty: "Easy", category: "Summaries", progressRequired: 10, unlockCondition: "quickRevisions >= 10" },
  { id: "concept_king", name: "Concept King", description: "Use Concept Breakdown 10 times", icon: "git-network", color: "#4F8EF7", difficulty: "Medium", category: "Summaries", progressRequired: 10, unlockCondition: "conceptBreakdowns >= 10" },

  // ── EXAMS (10) ─────────────────────────────────────────────────────────────
  { id: "first_exam", name: "Exam Taker", description: "Complete your first exam", icon: "school", color: "#FF4D6A", difficulty: "Easy", category: "Exams", progressRequired: 1, unlockCondition: "examsCompleted >= 1" },
  { id: "exam_5", name: "Quiz Rookie", description: "Complete 5 exams", icon: "school-outline", color: "#FF4D6A", difficulty: "Easy", category: "Exams", progressRequired: 5, unlockCondition: "examsCompleted >= 5" },
  { id: "exam_warrior", name: "Exam Warrior", description: "Complete 10 exams", icon: "shield-checkmark", color: "#FF4D6A", difficulty: "Medium", category: "Exams", progressRequired: 10, unlockCondition: "examsCompleted >= 10" },
  { id: "exam_25", name: "Exam Veteran", description: "Complete 25 exams", icon: "shield-checkmark-outline", color: "#FF4D6A", difficulty: "Medium", category: "Exams", progressRequired: 25, unlockCondition: "examsCompleted >= 25" },
  { id: "exam_50", name: "Exam Elite", description: "Complete 50 exams", icon: "medal", color: "#FF4D6A", difficulty: "Hard", category: "Exams", progressRequired: 50, unlockCondition: "examsCompleted >= 50" },
  { id: "exam_100", name: "Exam God", description: "Complete 100 exams", icon: "trophy", color: "#F5C842", difficulty: "Elite", category: "Exams", progressRequired: 100, unlockCondition: "examsCompleted >= 100" },
  { id: "perfect_score", name: "Perfect Score", description: "Score 100% on an exam", icon: "star", color: "#F5C842", difficulty: "Hard", category: "Exams", progressRequired: 1, unlockCondition: "perfectScores >= 1" },
  { id: "perfect_3", name: "Triple Perfect", description: "Score 100% on 3 exams", icon: "star-outline", color: "#F5C842", difficulty: "Elite", category: "Exams", progressRequired: 3, unlockCondition: "perfectScores >= 3" },
  { id: "top_scorer", name: "Top Scorer", description: "Score above 90% on 5 exams", icon: "podium", color: "#F5C842", difficulty: "Elite", category: "Exams", progressRequired: 5, unlockCondition: "highScores >= 5" },
  { id: "top_10_scores", name: "Consistent Winner", description: "Score above 90% on 10 exams", icon: "podium-outline", color: "#F5C842", difficulty: "Elite", category: "Exams", progressRequired: 10, unlockCondition: "highScores >= 10" },

  // ── CHAT (8) ───────────────────────────────────────────────────────────────
  { id: "first_chat", name: "AI Friend", description: "Send your first message to AI", icon: "chatbubble", color: "#7B5EF8", difficulty: "Easy", category: "Chat", progressRequired: 1, unlockCondition: "chatMessages >= 1" },
  { id: "chat_10", name: "Curious Mind", description: "Send 10 messages to AI", icon: "chatbubble-outline", color: "#7B5EF8", difficulty: "Easy", category: "Chat", progressRequired: 10, unlockCondition: "chatMessages >= 10" },
  { id: "chatterbox", name: "Chatterbox", description: "Send 50 messages to AI", icon: "chatbubbles", color: "#7B5EF8", difficulty: "Medium", category: "Chat", progressRequired: 50, unlockCondition: "chatMessages >= 50" },
  { id: "chat_100", name: "Deep Thinker", description: "Send 100 messages to AI", icon: "chatbubbles-outline", color: "#7B5EF8", difficulty: "Medium", category: "Chat", progressRequired: 100, unlockCondition: "chatMessages >= 100" },
  { id: "ai_whisperer", name: "AI Whisperer", description: "Send 200 messages to AI", icon: "mic", color: "#7B5EF8", difficulty: "Hard", category: "Chat", progressRequired: 200, unlockCondition: "chatMessages >= 200" },
  { id: "ai_master", name: "AI Master", description: "Send 500 messages to AI", icon: "mic-outline", color: "#7B5EF8", difficulty: "Hard", category: "Chat", progressRequired: 500, unlockCondition: "chatMessages >= 500" },
  { id: "ai_grandmaster", name: "AI Grandmaster", description: "Send 1000 messages to AI", icon: "hardware-chip", color: "#F5C842", difficulty: "Elite", category: "Chat", progressRequired: 1000, unlockCondition: "chatMessages >= 1000" },
  { id: "ai_legend", name: "AI Legend", description: "Send 2000 messages to AI", icon: "hardware-chip-outline", color: "#F5C842", difficulty: "Elite", category: "Chat", progressRequired: 2000, unlockCondition: "chatMessages >= 2000" },

  // ── STREAK (8) ─────────────────────────────────────────────────────────────
  { id: "streak_3", name: "On Fire", description: "Study 3 days in a row", icon: "flame", color: "#FF7043", difficulty: "Easy", category: "Streak", progressRequired: 3, unlockCondition: "streak >= 3" },
  { id: "streak_7", name: "Week Warrior", description: "Study 7 days in a row", icon: "flame", color: "#FF5722", difficulty: "Medium", category: "Streak", progressRequired: 7, unlockCondition: "streak >= 7" },
  { id: "streak_14", name: "Fortnight Fire", description: "Study 14 days in a row", icon: "flame-outline", color: "#FF5722", difficulty: "Medium", category: "Streak", progressRequired: 14, unlockCondition: "streak >= 14" },
  { id: "streak_21", name: "Habit Formed", description: "Study 21 days in a row", icon: "trending-up", color: "#FF7043", difficulty: "Hard", category: "Streak", progressRequired: 21, unlockCondition: "streak >= 21" },
  { id: "streak_30", name: "Dedication Master", description: "Study 30 days in a row", icon: "infinite", color: "#F5C842", difficulty: "Elite", category: "Streak", progressRequired: 30, unlockCondition: "streak >= 30" },
  { id: "streak_60", name: "Iron Discipline", description: "Study 60 days in a row", icon: "diamond", color: "#F5C842", difficulty: "Elite", category: "Streak", progressRequired: 60, unlockCondition: "streak >= 60" },
  { id: "streak_100", name: "Century Studier", description: "Study 100 days in a row", icon: "ribbon", color: "#F5C842", difficulty: "Elite", category: "Streak", progressRequired: 100, unlockCondition: "streak >= 100" },
  { id: "streak_365", name: "Year of Wisdom", description: "Study 365 days in a row", icon: "planet", color: "#F5C842", difficulty: "Elite", category: "Streak", progressRequired: 365, unlockCondition: "streak >= 365" },

  // ── LIBRARY (6) ────────────────────────────────────────────────────────────
  { id: "first_save", name: "First Bookmark", description: "Save your first item to the library", icon: "bookmark-outline", color: "#00D4AA", difficulty: "Easy", category: "Library", progressRequired: 1, unlockCondition: "librarySaved >= 1" },
  { id: "library_5", name: "Growing Library", description: "Save 5 items to your library", icon: "bookmark", color: "#00D4AA", difficulty: "Easy", category: "Library", progressRequired: 5, unlockCondition: "librarySaved >= 5" },
  { id: "librarian", name: "Librarian", description: "Save 20 items to your library", icon: "archive", color: "#00D4AA", difficulty: "Medium", category: "Library", progressRequired: 20, unlockCondition: "librarySaved >= 20" },
  { id: "knowledge_vault", name: "Knowledge Vault", description: "Save 50 items to your library", icon: "server", color: "#4F8EF7", difficulty: "Hard", category: "Library", progressRequired: 50, unlockCondition: "librarySaved >= 50" },
  { id: "library_100", name: "Digital Library", description: "Save 100 items to your library", icon: "library-outline", color: "#F5C842", difficulty: "Elite", category: "Library", progressRequired: 100, unlockCondition: "librarySaved >= 100" },
  { id: "library_200", name: "Grand Archive", description: "Save 200 items to your library", icon: "library", color: "#F5C842", difficulty: "Elite", category: "Library", progressRequired: 200, unlockCondition: "librarySaved >= 200" },

  // ── SUBJECTS (5) ───────────────────────────────────────────────────────────
  { id: "first_subject", name: "Subject Starter", description: "Study your first subject", icon: "book-outline", color: "#00D4AA", difficulty: "Easy", category: "Subjects", progressRequired: 1, unlockCondition: "subjectsStudied >= 1" },
  { id: "subject_2", name: "Dual Learner", description: "Study 2 different subjects", icon: "book", color: "#00D4AA", difficulty: "Easy", category: "Subjects", progressRequired: 2, unlockCondition: "subjectsStudied >= 2" },
  { id: "multi_subject", name: "All-Rounder", description: "Study across 3 different subjects", icon: "grid", color: "#00D4AA", difficulty: "Easy", category: "Subjects", progressRequired: 3, unlockCondition: "subjectsStudied >= 3" },
  { id: "polymath", name: "Polymath", description: "Study across 5 different subjects", icon: "earth", color: "#F5C842", difficulty: "Hard", category: "Subjects", progressRequired: 5, unlockCondition: "subjectsStudied >= 5" },
  { id: "subject_10", name: "Renaissance Scholar", description: "Study across 10 different subjects", icon: "globe-outline", color: "#F5C842", difficulty: "Elite", category: "Subjects", progressRequired: 10, unlockCondition: "subjectsStudied >= 10" },

  // ── ACCURACY (6) ───────────────────────────────────────────────────────────
  { id: "accuracy_50", name: "Getting There", description: "Maintain 50%+ overall accuracy", icon: "analytics-outline", color: "#FFB340", difficulty: "Easy", category: "Accuracy", progressRequired: 50, unlockCondition: "accuracy >= 50" },
  { id: "accuracy_60", name: "Decent Performer", description: "Maintain 60%+ overall accuracy", icon: "analytics", color: "#FFB340", difficulty: "Easy", category: "Accuracy", progressRequired: 60, unlockCondition: "accuracy >= 60" },
  { id: "accuracy_70", name: "Consistent", description: "Maintain 70%+ overall accuracy", icon: "checkmark-circle", color: "#22D46E", difficulty: "Easy", category: "Accuracy", progressRequired: 70, unlockCondition: "accuracy >= 70" },
  { id: "accuracy_75", name: "Above Average", description: "Maintain 75%+ overall accuracy", icon: "checkmark-circle-outline", color: "#22D46E", difficulty: "Medium", category: "Accuracy", progressRequired: 75, unlockCondition: "accuracy >= 75" },
  { id: "accuracy_85", name: "Sharp Mind", description: "Maintain 85%+ overall accuracy", icon: "checkmark-done-circle", color: "#22D46E", difficulty: "Medium", category: "Accuracy", progressRequired: 85, unlockCondition: "accuracy >= 85" },
  { id: "accuracy_95", name: "Genius", description: "Maintain 95%+ overall accuracy", icon: "ribbon", color: "#F5C842", difficulty: "Elite", category: "Accuracy", progressRequired: 95, unlockCondition: "accuracy >= 95" },

  // ── TIME (4) ───────────────────────────────────────────────────────────────
  { id: "early_bird", name: "Early Bird", description: "Study before 8 AM", icon: "sunny", color: "#FFB340", difficulty: "Easy", category: "Special", progressRequired: 1, unlockCondition: "earlyBirdSessions >= 1" },
  { id: "early_bird_5", name: "Dawn Scholar", description: "Study before 8 AM five times", icon: "sunny-outline", color: "#FFB340", difficulty: "Medium", category: "Special", progressRequired: 5, unlockCondition: "earlyBirdSessions >= 5" },
  { id: "night_owl", name: "Night Owl", description: "Study after 10 PM", icon: "moon", color: "#7B5EF8", difficulty: "Easy", category: "Special", progressRequired: 1, unlockCondition: "nightOwlSessions >= 1" },
  { id: "night_owl_5", name: "Midnight Scholar", description: "Study after 10 PM five times", icon: "moon-outline", color: "#7B5EF8", difficulty: "Medium", category: "Special", progressRequired: 5, unlockCondition: "nightOwlSessions >= 5" },

  // ── SPEED & COMEBACK (4) ───────────────────────────────────────────────────
  { id: "speed_demon", name: "Speed Demon", description: "Complete an exam in under half the time", icon: "speedometer", color: "#FF4D6A", difficulty: "Hard", category: "Special", progressRequired: 1, unlockCondition: "speedExams >= 1" },
  { id: "speed_5", name: "Flash Runner", description: "Complete 5 exams at high speed", icon: "speedometer-outline", color: "#FF4D6A", difficulty: "Elite", category: "Special", progressRequired: 5, unlockCondition: "speedExams >= 5" },
  { id: "comeback_kid", name: "Comeback Kid", description: "Improve score by 30%+ on a repeated topic", icon: "trending-up", color: "#4F8EF7", difficulty: "Hard", category: "Special", progressRequired: 1, unlockCondition: "comebacks >= 1" },
  { id: "comeback_5", name: "Phoenix Scholar", description: "Make 5 major comebacks", icon: "trending-up-outline", color: "#F5C842", difficulty: "Elite", category: "Special", progressRequired: 5, unlockCondition: "comebacks >= 5" },

  // ── AI PROVIDER (4) ────────────────────────────────────────────────────────
  { id: "ai_explorer", name: "AI Explorer", description: "Use 2 different AI providers", icon: "globe", color: "#7B5EF8", difficulty: "Medium", category: "AI", progressRequired: 2, unlockCondition: "providersUsed >= 2" },
  { id: "ai_trilingual", name: "AI Trilingual", description: "Use 3 different AI providers", icon: "globe-outline", color: "#7B5EF8", difficulty: "Hard", category: "AI", progressRequired: 3, unlockCondition: "providersUsed >= 3" },
  { id: "ai_connoisseur", name: "AI Connoisseur", description: "Use all 4 AI providers", icon: "planet", color: "#F5C842", difficulty: "Elite", category: "AI", progressRequired: 4, unlockCondition: "providersUsed >= 4" },

  // ── SCHEDULE (4) ───────────────────────────────────────────────────────────
  { id: "first_scheduled", name: "Planner", description: "Complete your first scheduled session", icon: "calendar", color: "#FFB340", difficulty: "Easy", category: "Schedule", progressRequired: 1, unlockCondition: "scheduledCompleted >= 1" },
  { id: "schedule_5", name: "Consistent Planner", description: "Complete 5 scheduled sessions", icon: "calendar-outline", color: "#FFB340", difficulty: "Easy", category: "Schedule", progressRequired: 5, unlockCondition: "scheduledCompleted >= 5" },
  { id: "schedule_20", name: "Disciplined", description: "Complete 20 scheduled sessions", icon: "calendar-number", color: "#FFB340", difficulty: "Medium", category: "Schedule", progressRequired: 20, unlockCondition: "scheduledCompleted >= 20" },
  { id: "schedule_50", name: "Study Machine", description: "Complete 50 scheduled sessions", icon: "calendar-number-outline", color: "#F5C842", difficulty: "Hard", category: "Schedule", progressRequired: 50, unlockCondition: "scheduledCompleted >= 50" },

  // ── COMBO & MILESTONE (20) ─────────────────────────────────────────────────
  { id: "full_scholar", name: "Full Scholar", description: "Use all 4 study features at least once", icon: "school-outline", color: "#4F8EF7", difficulty: "Easy", category: "Milestone", progressRequired: 4, unlockCondition: "notes >= 1 && summaries >= 1 && exams >= 1 && chat >= 1" },
  { id: "note_summary_combo", name: "Dual Creator", description: "Generate 10 notes and 10 summaries", icon: "create", color: "#4F8EF7", difficulty: "Medium", category: "Milestone", progressRequired: 20, unlockCondition: "notesGenerated >= 10 && summariesGenerated >= 10" },
  { id: "study_machine", name: "Study Machine", description: "Reach 100 total study activities", icon: "rocket", color: "#7B5EF8", difficulty: "Medium", category: "Milestone", progressRequired: 100, unlockCondition: "totalActivities >= 100" },
  { id: "ultimate_scholar", name: "Ultimate Scholar", description: "Reach 500 total study activities", icon: "rocket-outline", color: "#F5C842", difficulty: "Elite", category: "Milestone", progressRequired: 500, unlockCondition: "totalActivities >= 500" },
  { id: "legend_status", name: "Legend Status", description: "Reach 1000 total study activities", icon: "diamond", color: "#F5C842", difficulty: "Elite", category: "Milestone", progressRequired: 1000, unlockCondition: "totalActivities >= 1000" },
  { id: "daily_balance", name: "Daily Balance", description: "Study both early morning and late night", icon: "contrast", color: "#7B5EF8", difficulty: "Medium", category: "Special", progressRequired: 2, unlockCondition: "earlyBirdSessions >= 1 && nightOwlSessions >= 1" },
  { id: "balanced_student", name: "Well-Balanced", description: "Complete 25+ notes, summaries & exams each", icon: "scale", color: "#4F8EF7", difficulty: "Hard", category: "Milestone", progressRequired: 75, unlockCondition: "notesGenerated >= 25 && summariesGenerated >= 25 && examsCompleted >= 25" },
  { id: "master_all", name: "Grand Master", description: "100+ notes, summaries & exams each", icon: "star", color: "#F5C842", difficulty: "Elite", category: "Milestone", progressRequired: 300, unlockCondition: "notesGenerated >= 100 && summariesGenerated >= 100 && examsCompleted >= 100" },
  { id: "five_star_student", name: "Five Star Student", description: "Score 5 perfect exams", icon: "star-half", color: "#F5C842", difficulty: "Elite", category: "Exams", progressRequired: 5, unlockCondition: "perfectScores >= 5" },
  { id: "week_achiever", name: "Week Achiever", description: "7-day streak with 10+ exams done", icon: "trophy-outline", color: "#F5C842", difficulty: "Hard", category: "Milestone", progressRequired: 1, unlockCondition: "streak >= 7 && examsCompleted >= 10" },
  { id: "knowledge_seeker", name: "Knowledge Seeker", description: "Generate notes in 3+ subjects", icon: "search", color: "#4F8EF7", difficulty: "Medium", category: "Milestone", progressRequired: 1, unlockCondition: "subjectsStudied >= 3 && notesGenerated >= 10" },
  { id: "exam_chat_combo", name: "Study + Practice", description: "50+ exams and 200+ AI messages", icon: "fitness", color: "#7B5EF8", difficulty: "Elite", category: "Milestone", progressRequired: 1, unlockCondition: "examsCompleted >= 50 && chatMessages >= 200" },
  { id: "ai_powered", name: "AI Powered", description: "Use your AI key for the first time", icon: "key", color: "#4F8EF7", difficulty: "Easy", category: "AI", progressRequired: 1, unlockCondition: "providersUsed >= 1" },
  { id: "century_club", name: "Century Club", description: "100+ notes and 100+ exams completed", icon: "medal", color: "#F5C842", difficulty: "Elite", category: "Milestone", progressRequired: 200, unlockCondition: "notesGenerated >= 100 && examsCompleted >= 100" },
  { id: "crash_expert", name: "Crash Expert", description: "Generate 10 crash sheets", icon: "flash-outline", color: "#FFB340", difficulty: "Hard", category: "Summaries", progressRequired: 10, unlockCondition: "crashSheetsGenerated >= 10" },
  { id: "note_library_combo", name: "Collector Scholar", description: "50 notes + 50 library items saved", icon: "filing", color: "#4F8EF7", difficulty: "Hard", category: "Milestone", progressRequired: 100, unlockCondition: "notesGenerated >= 50 && librarySaved >= 50" },
  { id: "streak_exam_hero", name: "Streak Exam Hero", description: "30-day streak with 50+ exams", icon: "shield", color: "#F5C842", difficulty: "Elite", category: "Milestone", progressRequired: 1, unlockCondition: "streak >= 30 && examsCompleted >= 50" },
  { id: "summary_types_explorer", name: "Summary Explorer", description: "Try all 8 summary types", icon: "compass", color: "#00D4AA", difficulty: "Medium", category: "Summaries", progressRequired: 8, unlockCondition: "allSummaryTypesUsed >= 8" },
  { id: "weakness_fighter", name: "Weakness Fighter", description: "Complete 5 exams in your weakest subject", icon: "fitness-outline", color: "#FF4D6A", difficulty: "Hard", category: "Special", progressRequired: 5, unlockCondition: "weaknessSummaries >= 5" },
  { id: "perfect_week", name: "Perfect Week", description: "Study every day for 7 days", icon: "calendar-sharp", color: "#FFB340", difficulty: "Medium", category: "Streak", progressRequired: 7, unlockCondition: "streak >= 7" },
];
