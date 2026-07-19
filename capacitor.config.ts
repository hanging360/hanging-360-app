import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hanging360.app',
  appName: 'Hanging360',
  webDir: 'dist',
  server: {
    cleartext: false,
    url: 'https://tech.hanging360.com/my-appointment',
    allowNavigation: ['tech.hanging360.com']
  },
  ios: {
    contentInset: 'never'
  },
  plugins: {
    Keyboard: {
      resize: 'none'
    },
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
    }
  }
};

export default config;
