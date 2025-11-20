import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.talebedu.app',
  appName: 'TalebEdu',
  webDir: 'dist',
  server: {
    url: 'https://b9b768f5-1a7c-4563-ab9c-d1b25b963f4b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
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
