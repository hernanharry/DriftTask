import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotifPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return true;
    const { status: req } = await Notifications.requestPermissionsAsync();
    return req === "granted";
  } catch {
    return false;
  }
}

export async function scheduleTaskReminder(opts: {
  taskId: string;
  title: string;
  body: string;
  dueAt: Date;
}): Promise<string | null> {
  if (Platform.OS === "web") return null;
  const granted = await ensureNotifPermissions();
  if (!granted) return null;
  const seconds = Math.max(1, Math.floor((opts.dueAt.getTime() - Date.now()) / 1000));
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: opts.title,
        body: opts.body,
        data: { taskId: opts.taskId },
      },
      trigger: { seconds, repeats: false } as any,
    });
    return id;
  } catch (e) {
    console.warn("schedule failed", e);
    return null;
  }
}

export async function cancelReminder(id: string | null | undefined) {
  if (!id || Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}
