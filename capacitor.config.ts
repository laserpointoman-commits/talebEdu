import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.talebedu.app',
  appName: 'TalebEdu',
  webDir: 'dist',
  plugins: {
    CapacitorNFC: {
      enabled: true
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
