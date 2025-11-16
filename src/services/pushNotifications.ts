import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export class PushNotificationService {
  static async initialize() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    // Request permission
    const permission = await PushNotifications.requestPermissions();
    
    if (permission.receive === 'granted') {
      await PushNotifications.register();
    }

    // On success, register token with backend
    await PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      await this.savePushToken(token.value);
    });

    // On error
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Show notification when app is in foreground
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
      // You can show a local notification or update UI
    });

    // Action performed when tapping on a notification
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
      // Handle notification tap - navigate to specific screen
    });
  }

  static async savePushToken(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // TODO: Create a push_tokens table via migration to store tokens
      // For now, just log the token
      console.log('Push token registered:', token, 'for user:', user.id);
      
      // Example migration needed:
      // CREATE TABLE push_tokens (
      //   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      //   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      //   token text NOT NULL,
      //   platform text,
      //   created_at timestamptz DEFAULT now()
      // );
    } catch (error) {
      console.error('Error in savePushToken:', error);
    }
  }

  static async removeAllListeners() {
    await PushNotifications.removeAllListeners();
  }
}
