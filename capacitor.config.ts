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
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#000000',
      sound: 'default'
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'dark',
      backgroundColor: '#ffffffff'
    },
    Keyboard: {
      // La PWA remota ya administra 100dvh/visualViewport. Evita que
      // Capacitor reduzca por segunda vez el WebView al abrir el teclado.
      resize: 'none',
      resizeOnFullScreen: false,
      style: 'light'
    }
  }
};

export default config;
