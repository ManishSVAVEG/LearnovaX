import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure notifications to show alerts even when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Initialize notifications and request permissions
 */
export async function initializeNotifications(): Promise<void> {
  if (Platform.OS === "web") return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== "granted") {
    console.warn("Failed to get push token for push notification!");
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
}

/**
 * Schedule study notifications (3 times as requested)
 * @param title - Topic/Subject
 * @param date - Scheduled date
 * @param id - Session ID
 */
export async function scheduleStudyNotifications(
  title: string,
  subject: string,
  date: Date,
  id: string
): Promise<void> {
  if (Platform.OS === "web") return;

  // 1. Notification at the exact time
  await Notifications.scheduleNotificationAsync({
    identifier: `${id}_at`,
    content: {
      title: `🎓 Time to Study: ${title}`,
      body: `Your ${subject} session is starting now! Let's get to work.`,
      data: { sessionId: id },
      sound: true,
    },
    trigger: date,
  });

  // 2. Notification 5 minutes BEFORE
  const fiveMinBefore = new Date(date.getTime() - 5 * 60000);
  if (fiveMinBefore > new Date()) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${id}_before`,
      content: {
        title: `⏳ Starting Soon: ${title}`,
        body: `Your ${subject} session starts in 5 minutes. Get your materials ready!`,
        data: { sessionId: id },
        sound: true,
      },
      trigger: fiveMinBefore,
    });
  }

  // 3. Notification 5 minutes AFTER (Follow-up)
  const fiveMinAfter = new Date(date.getTime() + 5 * 60000);
  await Notifications.scheduleNotificationAsync({
    identifier: `${id}_after`,
    content: {
      title: `🚀 Don't Fall Behind!`,
      body: `Your ${subject} session for "${title}" started 5 minutes ago. Dive in now!`,
      data: { sessionId: id },
      sound: true,
    },
    trigger: fiveMinAfter,
  });
}

/**
 * Cancel all notifications for a session
 */
export async function cancelSessionNotifications(id: string): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(`${id}_at`);
  await Notifications.cancelScheduledNotificationAsync(`${id}_before`);
  await Notifications.cancelScheduledNotificationAsync(`${id}_after`);
}

/**
 * Clear all scheduled notifications
 */
export async function clearAllNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
