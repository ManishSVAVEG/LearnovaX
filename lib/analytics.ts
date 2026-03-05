import { StudyStats, ExamResult } from "./storage";

export interface AnalyticsData {
  totalActivities: number;
  accuracyTrend: number[]; // Last 7 days
  subjectPerformance: { subject: string; avgScore: number; exams: number }[];
  timeSeriesData: { date: string; activities: number }[];
  weeklyBreakdown: { day: string; count: number }[];
}

/**
 * Calculate analytics from stats
 */
export function calculateAnalytics(stats: StudyStats, examResults: ExamResult[]): AnalyticsData {
  const totalActivities = 
    stats.notesGenerated + 
    stats.summariesGenerated + 
    stats.examsCompleted + 
    stats.chatMessages;

  // Calculate subject performance
  const subjectMap: Record<string, { scores: number[]; count: number }> = {};
  
  if (examResults && Array.isArray(examResults)) {
    examResults.forEach((result) => {
      const subject = result.subject || "General";
      if (!subjectMap[subject]) {
        subjectMap[subject] = { scores: [], count: 0 };
      }
      const avgScore = (result.scoredMarks / result.totalMarks) * 100;
      subjectMap[subject].scores.push(avgScore);
      subjectMap[subject].count++;
    });
  }

  const subjectPerformance = Object.entries(subjectMap).map(([subject, data]) => ({
    subject,
    avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
    exams: data.count,
  }));

  // Weekly breakdown
  const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const weeklyBreakdown = weekDays.map((day, i) => ({
    day: day.substring(0, 3),
    count: stats.weeklyData?.[i] || 0,
  }));

  // Accuracy trend (simulated from exam results)
  const accuracyTrend = examResults.slice(-7).map((result) => 
    Math.round((result.scoredMarks / result.totalMarks) * 100)
  );

  // Time series data (last 30 days)
  const timeSeriesData: { date: string; activities: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    timeSeriesData.push({
      date: date.toLocaleDateString(),
      activities: i < 7 ? stats.weeklyData?.[date.getDay()] || 0 : 0,
    });
  }

  return {
    totalActivities,
    accuracyTrend,
    subjectPerformance: subjectPerformance.sort((a, b) => b.avgScore - a.avgScore),
    timeSeriesData,
    weeklyBreakdown,
  };
}

/**
 * Calculate improvement percentage
 */
export function calculateImprovement(scores: number[]): number {
  if (scores.length < 2) return 0;
  const oldScore = scores[0];
  const newScore = scores[scores.length - 1];
  if (oldScore === 0) return 0;
  return Math.round(((newScore - oldScore) / oldScore) * 100);
}

/**
 * Get weak subjects
 */
export function getWeakSubjects(
  examResults: ExamResult[],
  threshold = 70
): { subject: string; avgScore: number; count: number }[] {
  const subjectScores: Record<string, number[]> = {};

  if (examResults && Array.isArray(examResults)) {
    examResults.forEach((result) => {
      const subject = result.subject || "General";
      const score = Math.round((result.scoredMarks / result.totalMarks) * 100);
      if (!subjectScores[subject]) {
        subjectScores[subject] = [];
      }
      subjectScores[subject].push(score);
    });
  }

  return Object.entries(subjectScores)
    .map(([subject, scores]) => ({
      subject,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      count: scores.length,
    }))
    .filter((s) => s.avgScore < threshold)
    .sort((a, b) => a.avgScore - b.avgScore);
}

/**
 * Get strong subjects
 */
export function getStrongSubjects(
  examResults: ExamResult[],
  threshold = 80
): { subject: string; avgScore: number; count: number }[] {
  const subjectScores: Record<string, number[]> = {};

  if (examResults && Array.isArray(examResults)) {
    examResults.forEach((result) => {
      const subject = result.subject || "General";
      const score = Math.round((result.scoredMarks / result.totalMarks) * 100);
      if (!subjectScores[subject]) {
        subjectScores[subject] = [];
      }
      subjectScores[subject].push(score);
    });
  }

  return Object.entries(subjectScores)
    .map(([subject, scores]) => ({
      subject,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      count: scores.length,
    }))
    .filter((s) => s.avgScore >= threshold)
    .sort((a, b) => b.avgScore - a.avgScore);
}

/**
 * Calculate learning velocity (improvement rate)
 */
export function calculateLearningVelocity(examResults: ExamResult[]): number {
  if (examResults.length < 2) return 0;

  let improvements = 0;
  for (let i = 1; i < Math.min(examResults.length, 10); i++) {
    const prevScore = (examResults[i].scoredMarks / examResults[i].totalMarks) * 100;
    const currScore = (examResults[i - 1].scoredMarks / examResults[i - 1].totalMarks) * 100;
    if (currScore > prevScore) improvements++;
  }

  return Math.round((improvements / Math.min(examResults.length - 1, 9)) * 100);
}

/**
 * Estimate proficiency level
 */
export function estimateProficiency(avgAccuracy: number): string {
  if (avgAccuracy >= 95) return "Master";
  if (avgAccuracy >= 85) return "Expert";
  if (avgAccuracy >= 75) return "Advanced";
  if (avgAccuracy >= 65) return "Intermediate";
  if (avgAccuracy >= 50) return "Beginner";
  return "Struggling";
}

/**
 * Calculate study efficiency (activities vs accuracy)
 */
export function calculateStudyEfficiency(stats: StudyStats): number {
  const activities = stats.examsCompleted + stats.notesGenerated + stats.summariesGenerated;
  if (activities === 0) return 0;
  return Math.round((stats.accuracy / 100) * 100);
}

/**
 * Get recommendations based on performance
 */
export function getRecommendations(stats: StudyStats, examResults: ExamResult[]): string[] {
  const recommendations: string[] = [];

  if (stats.accuracy < 50) {
    recommendations.push("Your accuracy is low. Focus on understanding core concepts better.");
  }

  if (stats.examsCompleted < 5) {
    recommendations.push("Complete more practice exams to build confidence.");
  }

  const weakSubjects = getWeakSubjects(examResults, 70);
  if (weakSubjects.length > 0) {
    const weakSubj = weakSubjects[0].subject;
    recommendations.push(`Focus on ${weakSubj} - it's your weakest area. Try our weakness-based summaries.`);
  }

  if (stats.streak < 7) {
    recommendations.push("Build a study streak by studying consistently every day!");
  }

  if (stats.chatMessages < stats.examsCompleted / 2) {
    recommendations.push("Use the AI assistant more to clarify concepts and improve understanding.");
  }

  if (stats.librarySaved < stats.notesGenerated / 2) {
    recommendations.push("Save more important notes to your library for quick revision.");
  }

  return recommendations.slice(0, 3); // Return top 3
}

/**
 * Calculate study time estimation for topic mastery
 */
export function estimateStudyTime(
  currentAccuracy: number,
  targetAccuracy = 90,
  averageSessionMinutes = 30
): number {
  const accuracyGap = Math.max(0, targetAccuracy - currentAccuracy);
  const estimatedSessions = Math.ceil((accuracyGap / 10) * 2); // Rough estimate
  return estimatedSessions * averageSessionMinutes;
}

/**
 * Export analytics as JSON
 */
export function exportAnalyticsJSON(data: AnalyticsData, stats: StudyStats): string {
  const timestamp = new Date().toISOString();
  return JSON.stringify(
    {
      timestamp,
      summary: {
        totalActivities: data.totalActivities,
        currentAccuracy: stats.accuracy,
        streak: stats.streak,
        badges: stats.badges.length,
      },
      analytics: data,
    },
    null,
    2
  );
}
