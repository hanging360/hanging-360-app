import { registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";

type SplashScreenPlugin = {
  hide: () => Promise<void>;
};

type StatusBarPlugin = {
  hide: () => Promise<void>;
  setOverlaysWebView: (options: { overlay: boolean }) => Promise<void>;
};

type PermissionState = "prompt" | "prompt-with-rationale" | "granted" | "denied";

type PushNotificationsPlugin = {
  requestPermissions: () => Promise<{ receive: PermissionState }>;
  register: () => Promise<void>;
  addListener: (
    eventName: "registration",
    listenerFunc: (token: { value: string }) => void,
  ) => Promise<PluginListenerHandle>;
  addListener: (
    eventName: "registrationError",
    listenerFunc: (error: unknown) => void,
  ) => Promise<PluginListenerHandle>;
  addListener: (
    eventName: "pushNotificationReceived",
    listenerFunc: (notification: unknown) => void,
  ) => Promise<PluginListenerHandle>;
  addListener: (
    eventName: "pushNotificationActionPerformed",
    listenerFunc: (action: unknown) => void,
  ) => Promise<PluginListenerHandle>;
};

export const SplashScreen = registerPlugin<SplashScreenPlugin>("SplashScreen");
export const StatusBar = registerPlugin<StatusBarPlugin>("StatusBar");
export const PushNotifications = registerPlugin<PushNotificationsPlugin>("PushNotifications");