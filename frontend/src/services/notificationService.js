/**
 * Notification Service
 * Handles local notification scheduling and permission management for Sammy app
 *
 * RELIABILITY NOTES:
 * - Uses allowWhileIdle for Doze mode compatibility
 * - Manually reschedules after each notification (more reliable than 'every')
 * - Restores notifications on app launch (handles app killed, device reboot)
 * - Settings are persisted to localStorage for restoration
 *
 * ANDROID PERMISSIONS (add to AndroidManifest.xml for maximum reliability):
 * - android.permission.SCHEDULE_EXACT_ALARM (Android 12+) - for precise timing
 * - android.permission.RECEIVE_BOOT_COMPLETED - for reschedule after reboot
 * - android.permission.POST_NOTIFICATIONS (Android 13+) - auto-requested by plugin
 *
 * Note: Even without boot receiver, notifications restore when user opens app.
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Notification IDs
const MORNING_REMINDER_ID = 1;

// Storage key for notification settings
const NOTIFICATION_STORAGE_KEY = 'sammy_notification_settings';

/**
 * Check if notifications are supported on this platform
 */
export const isNotificationSupported = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Request notification permissions from the OS
 * @returns {Promise<boolean>} True if permission granted
 */
export const requestPermissions = async () => {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported on this platform');
    return false;
  }

  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Check current notification permission status
 * @returns {Promise<boolean>} True if permission granted
 */
export const checkPermissions = async () => {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
};

/**
 * Convert time string (HH:mm) to next occurrence Date object
 * @param {string} time - Time in 24hr format (e.g., "08:00")
 * @returns {Date} Next occurrence of that time
 */
const getNextScheduleTime = (time) => {
  const [hours, minutes] = time.split(':').map(Number);

  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  return scheduledTime;
};

/**
 * Save notification settings to localStorage for restoration after reboot/app restart
 */
const saveNotificationSettings = (enabled, time) => {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify({ enabled, time }));
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
};

/**
 * Get saved notification settings
 */
const getSavedNotificationSettings = () => {
  try {
    const saved = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error reading notification settings:', error);
    return null;
  }
};

/**
 * Schedule a daily morning reminder notification
 * @param {string} time - Time in 24hr format (e.g., "08:00")
 * @param {boolean} saveSettings - Whether to save settings (default true)
 * @returns {Promise<boolean>} True if scheduled successfully
 */
export const scheduleDailyReminder = async (time, saveSettings = true) => {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported on this platform');
    return false;
  }

  try {
    // First, cancel any existing reminder
    await cancelReminder();

    // Check if we have permission
    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      console.warn('No notification permission, cannot schedule reminder');
      return false;
    }

    // Calculate next occurrence
    const scheduleAt = getNextScheduleTime(time);

    // Schedule the notification with reliability options
    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Good morning! ☀️',
          body: 'How did yesterday go? Tap to log with Sammy',
          id: MORNING_REMINDER_ID,
          schedule: {
            at: scheduleAt,
            allowWhileIdle: true, // CRITICAL: Fire even in Doze mode
            // Note: We DON'T use 'every' here - we manually reschedule for reliability
          },
          extra: {
            context: 'morning_checkin',
            scheduledTime: time, // Store the time so we can reschedule
          },
          // Android-specific options
          smallIcon: 'ic_stat_icon_config_sample', // Uses default if not found
          autoCancel: true,
        },
      ],
    });

    // Save settings for restoration after reboot/app restart
    if (saveSettings) {
      saveNotificationSettings(true, time);
    }

    console.log(`Morning reminder scheduled for ${scheduleAt.toLocaleString()} (allowWhileIdle: true)`);
    return true;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    return false;
  }
};

/**
 * Cancel the morning reminder notification
 * @param {boolean} clearSettings - Whether to clear saved settings (default true)
 * @returns {Promise<boolean>} True if cancelled successfully
 */
export const cancelReminder = async (clearSettings = true) => {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: MORNING_REMINDER_ID }],
    });

    // Clear saved settings so notification doesn't restore on app restart
    if (clearSettings) {
      saveNotificationSettings(false, null);
    }

    console.log('Morning reminder cancelled');
    return true;
  } catch (error) {
    console.error('Error cancelling reminder:', error);
    return false;
  }
};

/**
 * Schedule a test notification (fires in 5 seconds)
 * Used for developer mode testing
 * @returns {Promise<boolean>} True if scheduled successfully
 */
export const scheduleTestNotification = async () => {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported on this platform');
    return false;
  }

  try {
    const testTime = new Date(Date.now() + 5000); // 5 seconds from now

    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Good morning! ☀️',
          body: 'How did yesterday go? Tap to log with Sammy',
          id: 99999, // Different ID so it doesn't conflict with real reminder
          schedule: {
            at: testTime,
          },
          extra: {
            context: 'morning_checkin',
          },
        },
      ],
    });

    console.log('Test notification scheduled for', testTime.toLocaleString());
    return true;
  } catch (error) {
    console.error('Error scheduling test notification:', error);
    return false;
  }
};

/**
 * Setup notification action listeners
 * Call this once on app startup
 * @param {Function} onNotificationTap - Callback when notification is tapped
 */
export const setupNotificationHandlers = (onNotificationTap) => {
  if (!isNotificationSupported()) {
    return;
  }

  try {
    // Listen for when notification is received/displayed (to reschedule for next day)
    LocalNotifications.addListener('localNotificationReceived', async (notification) => {
      console.log('Notification received:', notification);

      // Check if this is our morning reminder
      if (notification.id === MORNING_REMINDER_ID) {
        const scheduledTime = notification.extra?.scheduledTime;
        if (scheduledTime) {
          console.log('Rescheduling morning reminder for tomorrow at', scheduledTime);
          // Small delay to ensure current notification is fully processed
          setTimeout(async () => {
            await scheduleDailyReminder(scheduledTime, false); // Don't re-save settings
          }, 1000);
        }
      }
    });

    // Listen for notification taps
    LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
      console.log('Notification tapped:', notification);

      const context = notification.notification.extra?.context;
      const scheduledTime = notification.notification.extra?.scheduledTime;

      // Reschedule for tomorrow (in case received event didn't fire)
      if (notification.notification.id === MORNING_REMINDER_ID && scheduledTime) {
        console.log('Rescheduling morning reminder after tap for tomorrow at', scheduledTime);
        await scheduleDailyReminder(scheduledTime, false);
      }

      if (context && onNotificationTap) {
        onNotificationTap(context);
      }
    });

    console.log('Notification handlers setup complete');
  } catch (error) {
    console.error('Error setting up notification handlers:', error);
  }
};

/**
 * Restore notifications on app launch
 * Call this on app startup to ensure notifications are scheduled
 * This handles cases where:
 * - App was killed and restarted
 * - Device rebooted
 * - Notification somehow got cancelled
 */
export const restoreNotifications = async () => {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    const settings = getSavedNotificationSettings();

    if (!settings || !settings.enabled || !settings.time) {
      console.log('No notification settings to restore');
      return false;
    }

    // Check if there's already a pending notification
    const pending = await getPendingNotifications();
    const hasMorningReminder = pending.some(n => n.id === MORNING_REMINDER_ID);

    if (hasMorningReminder) {
      console.log('Morning reminder already scheduled, no restore needed');
      return true;
    }

    // Reschedule the notification
    console.log('Restoring morning reminder for', settings.time);
    return await scheduleDailyReminder(settings.time, false);
  } catch (error) {
    console.error('Error restoring notifications:', error);
    return false;
  }
};

/**
 * Remove all notification listeners
 * Call this on cleanup if needed
 */
export const removeNotificationHandlers = async () => {
  if (!isNotificationSupported()) {
    return;
  }

  try {
    await LocalNotifications.removeAllListeners();
  } catch (error) {
    console.error('Error removing notification handlers:', error);
  }
};

/**
 * Get list of pending notifications (for debugging)
 * @returns {Promise<Array>} List of pending notifications
 */
export const getPendingNotifications = async () => {
  if (!isNotificationSupported()) {
    return [];
  }

  try {
    const result = await LocalNotifications.getPending();
    return result.notifications || [];
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return [];
  }
};
