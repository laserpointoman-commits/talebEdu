import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.talebedu.app',
  appName: 'TalebEdu',
  webDir: 'dist',
  server: {
    url: "https://b9b768f5-1a7c-4563-ab9c-d1b25b963f4b.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    NFCPlugin: {
      enabled: true
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'light'
    }
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#FFFFFF',
    allowsBackForwardNavigationGestures: true
  }
};

export default config;
