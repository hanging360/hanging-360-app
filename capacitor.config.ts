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
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
