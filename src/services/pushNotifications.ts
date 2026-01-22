import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export class PushNotificationService {
  private static initialized = false;

  static async initialize() {
    if (this.initialized) {
      console.log('Push notifications already initialized');
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    // IMPORTANT (Android): Capacitor PushNotifications requires Firebase (FCM) to be configured.
    // If google-services.json isn't present / Firebase isn't initialized, calling register() will
    // crash the native app process. Until Android FCM is set up, we safely no-op on Android.
    const platform = Capacitor.getPlatform();
    if (platform === 'android') {
      console.warn(
        '[PushNotifications] Android push is disabled because Firebase/FCM is not configured. ' +
          'This prevents an app crash. (iOS push remains enabled.)'
      );
      return;
    }

    try {
      // Check current permission status
      let permission = await PushNotifications.checkPermissions();
      
      if (permission.receive === 'prompt') {
        // Request permission
        permission = await PushNotifications.requestPermissions();
      }
      
      if (permission.receive !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      // Register for push notifications (iOS)
      await PushNotifications.register();

      // On success, register token with backend
      await PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token: ' + token.value);
        await this.savePushToken(token.value);
      });

      // On error
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', JSON.stringify(error));
      });

      // Show notification when app is in foreground
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received in foreground:', JSON.stringify(notification));
        // The notification will be displayed by the system on iOS
      });

      // Action performed when tapping on a notification
      await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed:', JSON.stringify(notification));
        // Handle notification tap - navigate to specific screen based on data
        const data = notification.notification.data;
        if (data?.route) {
          window.location.href = data.route;
        }
      });

      this.initialized = true;
      console.log('Push notifications initialized successfully');
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  static async savePushToken(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in, cannot save push token');
        return;
      }

      const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
      
      // Upsert the token (update if exists, insert if not)
      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: user.id,
            token: token,
            platform: platform,
            token_type: 'push',
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,token,token_type',
          }
        );

      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token saved successfully for user:', user.id);
      }
    } catch (error) {
      console.error('Error in savePushToken:', error);
    }
  }

  static async removePushToken() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark all tokens for this user as inactive
      const { error } = await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing push token:', error);
      }
    } catch (error) {
      console.error('Error in removePushToken:', error);
    }
  }

  static async removeAllListeners() {
    await PushNotifications.removeAllListeners();
    this.initialized = false;
  }

  // Helper to send a notification to specific users
  static async sendNotification(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_ids: userIds,
          title,
          body,
          data,
        },
      });

      if (error) {
        console.error('Error sending push notification:', error);
        return { success: false, error };
      }

      console.log('Push notification sent:', result);
      return { success: true, result };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error };
    }
  }
}
