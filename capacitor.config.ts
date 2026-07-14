import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hanging360.app',
  appName: 'Hanging360',
  webDir: 'dist',
  server: {
    cleartext: false,
    allowNavigation: ['tech.hanging360.com']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 250,
      launchAutoHide: true,
      launchFadeOutDuration: 100,
      backgroundColor: '#ffffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
