import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hanging360.app',
  appName: 'Hanging360',
  webDir: 'www',
  server: {
    url: 'https://tech.hanging360.com/my-appointment',
    cleartext: false
  }
};

export default config;
