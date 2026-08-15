import { Platform } from 'react-native';

let Notifications = null;
let isNotificationsAvailable = false;

if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
      isNotificationsAvailable = true;
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }
  } catch (e) {
    console.log('expo-notifications module not loaded or disabled in this environment.');
  }
}

const PERSISTENT_NOTIFICATION_ID = 'voice_assistant_quick_tile';

/**
 * Calculates a future timestamp based on extracted date and time strings.
 * @param {string} dateStr 
 * @param {string} timeStr 
 * @returns {Date} Target trigger Date
 */
export const calculateReminderDate = (dateStr = 'Today', timeStr = 'Anytime') => {
  const now = new Date();
  const target = new Date(now);

  const lowerDate = dateStr.toLowerCase();
  const lowerTime = timeStr.toLowerCase();

  // 1. Date offset
  if (lowerDate.includes('tomorrow')) {
    target.setDate(target.getDate() + 1);
  } else if (lowerDate.includes('next')) {
    target.setDate(target.getDate() + 7);
  }

  // Check for "in X minutes/hours"
  const inMinMatch = lowerTime.match(/in\s+(\d+)\s*(?:min|minute)/i) || lowerDate.match(/in\s+(\d+)\s*(?:min|minute)/i);
  if (inMinMatch) {
    const mins = parseInt(inMinMatch[1], 10);
    return new Date(Date.now() + mins * 60 * 1000);
  }

  const inHourMatch = lowerTime.match(/in\s+(\d+)\s*(?:hr|hour)/i) || lowerDate.match(/in\s+(\d+)\s*(?:hr|hour)/i);
  if (inHourMatch) {
    const hrs = parseInt(inHourMatch[1], 10);
    return new Date(Date.now() + hrs * 3600 * 1000);
  }

  // 2. Parse time (e.g., "5:30 PM", "9 AM", "evening", "morning")
  const timeMatch = lowerTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const modifier = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

    if (modifier === 'pm' && hours < 12) hours += 12;
    if (modifier === 'am' && hours === 12) hours = 0;

    target.setHours(hours, minutes, 0, 0);
  } else if (lowerTime.includes('morning')) {
    target.setHours(9, 0, 0, 0);
  } else if (lowerTime.includes('afternoon')) {
    target.setHours(14, 0, 0, 0);
  } else if (lowerTime.includes('evening') || lowerTime.includes('tonight')) {
    target.setHours(19, 0, 0, 0);
  } else {
    target.setHours(target.getHours() + 1, 0, 0, 0);
  }

  if (target <= now && !lowerDate.includes('tomorrow')) {
    target.setDate(target.getDate() + 1);
  }

  return target;
};

/**
 * Requests push notification permissions
 */
export const requestNotificationPermissions = async () => {
  if (!isNotificationsAvailable) return true;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Creates or refreshes a persistent quick-access background notification in the status bar
 */
export const setupPersistentAssistantNotification = async () => {
  if (!isNotificationsAvailable) return;
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    try {
      await Notifications.dismissNotificationAsync(PERSISTENT_NOTIFICATION_ID);
    } catch (e) {}

    await Notifications.scheduleNotificationAsync({
      identifier: PERSISTENT_NOTIFICATION_ID,
      content: {
        title: '🎙️ Voice Assistant Ready',
        body: 'Pull down and tap here from anywhere to speak commands!',
        sticky: true,
        priority: Notifications.AndroidNotificationPriority?.MAX,
        data: { action: 'ACTIVATE_VOICE' },
      },
      trigger: null,
    });
    console.log('Persistent background notification setup successfully.');
  } catch (e) {
    console.warn('Error setting up persistent notification:', e);
  }
};

/**
 * Dismisses the persistent quick-access notification
 */
export const dismissPersistentAssistantNotification = async () => {
  if (!isNotificationsAvailable) return;
  try {
    await Notifications.dismissNotificationAsync(PERSISTENT_NOTIFICATION_ID);
  } catch (e) {
    console.warn('Error dismissing persistent notification:', e);
  }
};

/**
 * Schedules a local background push notification for a task
 */
export const scheduleTaskNotification = async (task, date, time) => {
  try {
    const targetDate = calculateReminderDate(date, time);
    const secondsFromNow = Math.max(Math.round((targetDate.getTime() - Date.now()) / 1000), 5);

    if (isNotificationsAvailable) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ VoiceTask Reminder',
            body: `Don't forget: ${task}`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority?.HIGH,
            data: { task, date, time },
          },
          trigger: {
            seconds: secondsFromNow,
          },
        });
        console.log(`Notification scheduled for ${targetDate.toLocaleTimeString()} (id: ${id})`);
        return id;
      }
    }
  } catch (error) {
    console.warn('Could not schedule local notification:', error);
  }
  return null;
};

/**
 * Cancels a previously scheduled notification
 */
export const cancelTaskNotification = async (notificationId) => {
  if (!notificationId || !isNotificationsAvailable) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('Error cancelling notification:', error);
  }
};

/**
 * Registers response listener for when user taps the background notification
 */
export const addNotificationResponseListener = (callback) => {
  if (isNotificationsAvailable && Notifications.addNotificationResponseReceivedListener) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
  return { remove: () => {} };
};
