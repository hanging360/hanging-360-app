import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.5b3efdff0bb64b46b9a09667099613c7",
  appName: "wrap-access-now",
  webDir: "dist",
  server: {
    url: "https://5b3efdff-0bb6-4b46-b9a0-9667099613c7.lovableproject.com?forceHideBadge=true",
    cleartext: true,
    allowNavigation: ["tech.hanging360.com"],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      backgroundColor: "#ffffff",
    },
  },
};

export default config;
