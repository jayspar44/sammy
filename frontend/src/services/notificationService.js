/**
 * Notification Service
 * Handles local notification scheduling and permission management for Sammy app
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Notification IDs
const MORNING_REMINDER_ID = 1;

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
 * Schedule a daily morning reminder notification
 * @param {string} time - Time in 24hr format (e.g., "08:00")
 * @returns {Promise<boolean>} True if scheduled successfully
 */
export const scheduleDailyReminder = async (time) => {
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

    // Schedule the notification
    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Good morning! ☀️',
          body: 'How did yesterday go? Tap to log with Sammy',
          id: MORNING_REMINDER_ID,
          schedule: {
            at: scheduleAt,
            every: 'day', // Repeat daily
          },
          extra: {
            context: 'morning_checkin',
          },
        },
      ],
    });

    console.log(`Morning reminder scheduled for ${scheduleAt.toLocaleString()}`);
    return true;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    return false;
  }
};

/**
 * Cancel the morning reminder notification
 * @returns {Promise<boolean>} True if cancelled successfully
 */
export const cancelReminder = async () => {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: MORNING_REMINDER_ID }],
    });
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
    // Listen for notification taps
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Notification tapped:', notification);

      const context = notification.notification.extra?.context;
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
