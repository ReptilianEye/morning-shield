import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { formatTime24, WakeWindow } from '@/store/useMorningStore';

const WAKEUP_NOTIFICATION_ID = 'morning-shield-wakeup-reminder';
export const MORNING_REMINDER_ACTION = 'open-challenge';

export function isMorningReminderResponse(
  response: Notifications.NotificationResponse | null | undefined
): response is Notifications.NotificationResponse {
  if (!response) return false;
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
    return false;
  }
  return response.notification.request.content.data?.action === MORNING_REMINDER_ACTION;
}

let handlerConfigured = false;

export function configureNotificationHandler(): void {
  if (handlerConfigured || Platform.OS === 'web') return;
  handlerConfigured = true;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Ignore on unsupported runtimes
  }
}

export interface SyncNotificationResult {
  scheduled: boolean;
  permissionStatus: 'granted' | 'denied' | 'undetermined' | 'unavailable';
  scheduledTimeLabel?: string;
}

export async function syncWakeUpNotification(options: {
  notificationsEnabled: boolean;
  shieldEnabled: boolean;
  wakeWindow: WakeWindow;
  requestPermissionIfNeeded?: boolean;
}): Promise<SyncNotificationResult> {
  if (Platform.OS === 'web') {
    return { scheduled: false, permissionStatus: 'unavailable' };
  }

  configureNotificationHandler();

  try {
    await Notifications.cancelScheduledNotificationAsync(WAKEUP_NOTIFICATION_ID).catch(() => {});

    if (!options.notificationsEnabled || !options.shieldEnabled) {
      const current = await Notifications.getPermissionsAsync();
      return {
        scheduled: false,
        permissionStatus: current.granted ? 'granted' : 'undetermined',
      };
    }

    let perms = await Notifications.getPermissionsAsync();
    if (!perms.granted && options.requestPermissionIfNeeded) {
      perms = await Notifications.requestPermissionsAsync();
    }

    if (!perms.granted) {
      return {
        scheduled: false,
        permissionStatus: perms.canAskAgain === false ? 'denied' : 'undetermined',
      };
    }

    await Notifications.scheduleNotificationAsync({
      identifier: WAKEUP_NOTIFICATION_ID,
      content: {
        title: 'Time to unlock your morning',
        body: 'Complete your MorningShield challenge to start your day distraction-free.',
        sound: true,
        data: {
          action: MORNING_REMINDER_ACTION,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: options.wakeWindow.startHour,
        minute: options.wakeWindow.startMinute,
      },
    });

    return {
      scheduled: true,
      permissionStatus: 'granted',
      scheduledTimeLabel: formatTime24(
        options.wakeWindow.startHour,
        options.wakeWindow.startMinute
      ),
    };
  } catch {
    return { scheduled: false, permissionStatus: 'unavailable' };
  }
}
