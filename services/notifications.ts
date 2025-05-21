import * as Notifications from 'expo-notifications';

/**
 * Request notification permissions from the user
 */
export async function requestUserPermission() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('⚠️ Notification permission not granted');
      return false;
    }

    console.log('✅ Notification permission granted');
    return true;
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Set up notification handlers for foreground and background
 */
export function setupNotificationHandlers() {
  // Configure how notifications appear when the app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Listen to notification events
 */
export function notificationListener() {
  try {
    // Foreground notification listener
    const subscription1 = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Received foreground message:', notification);
    });

    // Background notification listener
    const subscription2 = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📬 Notification opened from background state:', response);
    });

    // Return cleanup function
    return () => {
      subscription1.remove();
      subscription2.remove();
    };
  } catch (error) {
    console.error('❌ Error setting up notification listeners:', error);
    return () => { };
  }
}
