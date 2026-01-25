/**
 * Notification Service
 * Handles local notification scheduling and permission management for Sammy app
 *
 * RELIABILITY NOTES:
 * - Uses allowWhileIdle for Doze mode compatibility
 * - Manually reschedules after each notification (more reliable than 'every')
 * - Restores notifications on app launch (handles app killed, device reboot)
 * - Settings are persisted to Capacitor Preferences (native storage, survives cache clear)
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
import { Preferences } from '@capacitor/preferences';
import { logger } from '../utils/logger';

// Notification IDs
const MORNING_REMINDER_ID = 1;
const PLANNING_REMINDER_ID = 2;

// Storage keys for notification settings
const NOTIFICATION_STORAGE_KEY = 'sammy_notification_settings';
const PLANNING_NOTIFICATION_STORAGE_KEY = 'sammy_planning_notification_settings';

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
    logger.warn('Notifications not supported on this platform');
    return false;
  }

  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    logger.error('Error requesting notification permissions:', error);
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
    logger.error('Error checking notification permissions:', error);
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
 * Save notification settings to Capacitor Preferences for restoration after reboot/app restart
 * Uses native storage which survives cache clears (unlike localStorage in WebView)
 */
const saveNotificationSettings = async (enabled, time) => {
  try {
    await Preferences.set({
      key: NOTIFICATION_STORAGE_KEY,
      value: JSON.stringify({ enabled, time })
    });
  } catch (error) {
    logger.error('Error saving notification settings:', error);
  }
};

/**
 * Get saved notification settings from Capacitor Preferences
 * @returns {Promise<{enabled: boolean, time: string}|null>}
 */
export const getSavedNotificationSettings = async () => {
  try {
    const { value } = await Preferences.get({ key: NOTIFICATION_STORAGE_KEY });
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Error reading notification settings:', error);
    return null;
  }
};

/**
 * Save planning notification settings to Capacitor Preferences
 */
const savePlanningNotificationSettings = async (enabled, dayOfWeek, time) => {
  try {
    await Preferences.set({
      key: PLANNING_NOTIFICATION_STORAGE_KEY,
      value: JSON.stringify({ enabled, dayOfWeek, time })
    });
  } catch (error) {
    logger.error('Error saving planning notification settings:', error);
  }
};

/**
 * Get saved planning notification settings from Capacitor Preferences
 * @returns {Promise<{enabled: boolean, dayOfWeek: number, time: string}|null>}
 */
export const getSavedPlanningNotificationSettings = async () => {
  try {
    const { value } = await Preferences.get({ key: PLANNING_NOTIFICATION_STORAGE_KEY });
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Error reading planning notification settings:', error);
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
    logger.warn('Notifications not supported on this platform');
    return false;
  }

  try {
    // First, cancel any existing reminder (don't clear settings - managed separately)
    await cancelReminder(false);

    // Check if we have permission
    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      logger.warn('No notification permission, cannot schedule reminder');
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
      await saveNotificationSettings(true, time);
    }

    logger.debug(`Morning reminder scheduled for ${scheduleAt.toLocaleString()} (allowWhileIdle: true)`);
    return true;
  } catch (error) {
    logger.error('Error scheduling daily reminder:', error);
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
      await saveNotificationSettings(false, null);
    }

    logger.debug('Morning reminder cancelled');
    return true;
  } catch (error) {
    logger.error('Error cancelling reminder:', error);
    return false;
  }
};

/**
 * Schedule a weekly planning reminder notification
 * @param {number} dayOfWeek - Day of week (0=Sunday, 1=Monday, etc.)
 * @param {string} time - Time in 24hr format (e.g., "18:00")
 * @param {boolean} saveSettings - Whether to save settings (default true)
 * @returns {Promise<boolean>} True if scheduled successfully
 */
export const schedulePlanningReminder = async (dayOfWeek, time, saveSettings = true) => {
  if (!isNotificationSupported()) {
    logger.warn('Notifications not supported on this platform');
    return false;
  }

  try {
    // First, cancel any existing planning reminder
    await cancelPlanningReminder(false);

    // Check if we have permission
    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      logger.warn('No notification permission, cannot schedule planning reminder');
      return false;
    }

    // Calculate next occurrence of the specified day and time
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduleAt = new Date();

    // Find the next occurrence of the target day of week
    const currentDay = now.getDay();
    let daysUntilTarget = dayOfWeek - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Next week
    }

    scheduleAt.setDate(now.getDate() + daysUntilTarget);
    scheduleAt.setHours(hours, minutes, 0, 0);

    // If the time has already passed today and it's the target day, schedule for next week
    if (daysUntilTarget === 0 && scheduleAt <= now) {
      scheduleAt.setDate(scheduleAt.getDate() + 7);
    }

    // Schedule the notification
    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Ready to plan your week?',
          body: 'Tap to set your drinking targets with Sammy',
          id: PLANNING_REMINDER_ID,
          schedule: {
            at: scheduleAt,
            allowWhileIdle: true,
          },
          extra: {
            context: 'weekly_planning',
            scheduledDayOfWeek: dayOfWeek,
            scheduledTime: time,
          },
          smallIcon: 'ic_stat_icon_config_sample',
          autoCancel: true,
        },
      ],
    });

    // Save settings for restoration after reboot/app restart
    if (saveSettings) {
      await savePlanningNotificationSettings(true, dayOfWeek, time);
    }

    logger.debug(`Planning reminder scheduled for ${scheduleAt.toLocaleString()} (day ${dayOfWeek}, allowWhileIdle: true)`);
    return true;
  } catch (error) {
    logger.error('Error scheduling planning reminder:', error);
    return false;
  }
};

/**
 * Cancel the weekly planning reminder notification
 * @param {boolean} clearSettings - Whether to clear saved settings (default true)
 * @returns {Promise<boolean>} True if cancelled successfully
 */
export const cancelPlanningReminder = async (clearSettings = true) => {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: PLANNING_REMINDER_ID }],
    });

    if (clearSettings) {
      await savePlanningNotificationSettings(false, null, null);
    }

    logger.debug('Planning reminder cancelled');
    return true;
  } catch (error) {
    logger.error('Error cancelling planning reminder:', error);
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
    logger.warn('Notifications not supported on this platform');
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

    logger.debug('Test notification scheduled for', testTime.toLocaleString());
    return true;
  } catch (error) {
    logger.error('Error scheduling test notification:', error);
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
    // Listen for when notification is received/displayed (to reschedule)
    LocalNotifications.addListener('localNotificationReceived', async (notification) => {
      logger.debug('Notification received:', notification);

      // Check if this is our morning reminder
      if (notification.id === MORNING_REMINDER_ID) {
        const settings = await getSavedNotificationSettings();
        if (!settings?.enabled) {
          logger.debug('Morning notifications disabled, not rescheduling');
          return;
        }

        const scheduledTime = notification.extra?.scheduledTime;
        if (scheduledTime) {
          logger.debug('Rescheduling morning reminder for tomorrow at', scheduledTime);
          setTimeout(async () => {
            await scheduleDailyReminder(scheduledTime, false);
          }, 1000);
        }
      }

      // Check if this is our planning reminder
      if (notification.id === PLANNING_REMINDER_ID) {
        const settings = await getSavedPlanningNotificationSettings();
        if (!settings?.enabled) {
          logger.debug('Planning notifications disabled, not rescheduling');
          return;
        }

        const { scheduledDayOfWeek, scheduledTime } = notification.extra || {};
        if (scheduledDayOfWeek !== undefined && scheduledTime) {
          logger.debug('Rescheduling planning reminder for next week');
          setTimeout(async () => {
            await schedulePlanningReminder(scheduledDayOfWeek, scheduledTime, false);
          }, 1000);
        }
      }
    });

    // Listen for notification taps
    LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
      logger.debug('Notification tapped:', notification);

      const context = notification.notification.extra?.context;
      const notificationId = notification.notification.id;

      // Reschedule morning reminder
      if (notificationId === MORNING_REMINDER_ID) {
        const settings = await getSavedNotificationSettings();
        const scheduledTime = notification.notification.extra?.scheduledTime;
        if (settings?.enabled && scheduledTime) {
          logger.debug('Rescheduling morning reminder after tap');
          await scheduleDailyReminder(scheduledTime, false);
        }
      }

      // Reschedule planning reminder
      if (notificationId === PLANNING_REMINDER_ID) {
        const settings = await getSavedPlanningNotificationSettings();
        const { scheduledDayOfWeek, scheduledTime } = notification.notification.extra || {};
        if (settings?.enabled && scheduledDayOfWeek !== undefined && scheduledTime) {
          logger.debug('Rescheduling planning reminder after tap');
          await schedulePlanningReminder(scheduledDayOfWeek, scheduledTime, false);
        }
      }

      if (context && onNotificationTap) {
        onNotificationTap(context);
      }
    });

    logger.debug('Notification handlers setup complete');
  } catch (error) {
    logger.error('Error setting up notification handlers:', error);
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

  let morningRestored = false;
  let planningRestored = false;

  try {
    const pending = await getPendingNotifications();

    // Restore morning reminder
    const morningSettings = await getSavedNotificationSettings();
    if (morningSettings?.enabled && morningSettings?.time) {
      const hasMorningReminder = pending.some(n => n.id === MORNING_REMINDER_ID);
      if (!hasMorningReminder) {
        logger.debug('Restoring morning reminder for', morningSettings.time);
        morningRestored = await scheduleDailyReminder(morningSettings.time, false);
      } else {
        logger.debug('Morning reminder already scheduled');
        morningRestored = true;
      }
    }

    // Restore planning reminder
    const planningSettings = await getSavedPlanningNotificationSettings();
    if (planningSettings?.enabled && planningSettings?.dayOfWeek !== undefined && planningSettings?.time) {
      const hasPlanningReminder = pending.some(n => n.id === PLANNING_REMINDER_ID);
      if (!hasPlanningReminder) {
        logger.debug('Restoring planning reminder for day', planningSettings.dayOfWeek, 'at', planningSettings.time);
        planningRestored = await schedulePlanningReminder(planningSettings.dayOfWeek, planningSettings.time, false);
      } else {
        logger.debug('Planning reminder already scheduled');
        planningRestored = true;
      }
    }

    return morningRestored || planningRestored;
  } catch (error) {
    logger.error('Error restoring notifications:', error);
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
    logger.error('Error removing notification handlers:', error);
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
    logger.error('Error getting pending notifications:', error);
    return [];
  }
};
