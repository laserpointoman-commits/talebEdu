import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.talebedu.app',
  appName: 'TalebEdu',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      launchFadeOutDuration: 0,
      showSpinner: false
    },
    StatusBar: {
      style: 'light'
    }
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#FFFFFF',
    allowsBackForwardNavigationGestures: true
  }
};

export default config;
