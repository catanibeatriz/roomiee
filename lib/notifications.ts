import * as Notifications from 'expo-notifications';
import { Currency, formatMoney } from './currency';

// Local bill reminders. (Local notifications work in Expo Go on iOS; full push
// needs a dev build, but scheduled local reminders are enough for the feature.)

export function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Schedule a recurring monthly reminder ~2 days before a bill's due day. */
export async function scheduleBillReminder(
  name: string,
  amount: number,
  currency: Currency,
  dueDay: number,
): Promise<string | null> {
  const ok = await ensureNotificationPermission();
  if (!ok) return null;

  const remindDay = Math.max(1, dueDay - 2);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `💸 ${name} is due soon`,
      body: `${name} (${formatMoney(amount, currency)}) is due on the ${dueDay}. Don't forget your share!`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      day: remindDay,
      hour: 10,
      minute: 0,
      repeats: true,
    },
  });
}

export async function cancelReminder(id?: string) {
  if (!id) return;
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
}
