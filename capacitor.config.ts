import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.talebedu',
  appName: 'TalebEdu School System',
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
