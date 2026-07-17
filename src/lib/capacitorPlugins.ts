type PluginListenerHandle = {
  remove: () => Promise<void>;
};

type CapacitorBridge = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: Record<string, Record<string, unknown>>;
};

const getBridge = () => (window as Window & { Capacitor?: CapacitorBridge }).Capacitor;

export const isNativePlatform = () => {
  const bridge = getBridge();
  if (!bridge) return false;
  if (typeof bridge.isNativePlatform === "function") return bridge.isNativePlatform();
  return bridge.getPlatform?.() !== "web";
};

export const getPlatform = (): "ios" | "android" | "web" => {
  const bridge = getBridge();
  const p = bridge?.getPlatform?.();
  if (p === "ios" || p === "android") return p;
  return "web";
};

const listenerHandle: PluginListenerHandle = {
  remove: async () => {},
};

const resolvePlugin = <T extends object>(name: string, fallback: T): T => {
  const plugin = getBridge()?.Plugins?.[name];
  return (plugin ?? fallback) as T;
};

type SplashScreenPlugin = {
  hide: () => Promise<void>;
};

type StatusBarPlugin = {
  hide: () => Promise<void>;
  setOverlaysWebView: (options: { overlay: boolean }) => Promise<void>;
};

type PermissionState = "prompt" | "prompt-with-rationale" | "granted" | "denied";

type PushNotificationChannel = {
  id: string;
  name: string;
  description?: string;
  importance?: number;
  visibility?: number;
  sound?: string;
  vibration?: boolean;
  lights?: boolean;
};

interface PushNotificationsPlugin {
  createChannel?: (channel: PushNotificationChannel) => Promise<void>;
  deleteChannel?: (options: { id: string }) => Promise<void>;
  requestPermissions: () => Promise<{ receive: PermissionState }>;
  register: () => Promise<void>;
  addListener: (
    eventName: "registration" | "registrationError" | "pushNotificationReceived" | "pushNotificationActionPerformed",
    listenerFunc: (payload: unknown) => void,
  ) => Promise<PluginListenerHandle>;
}

export const SplashScreen: SplashScreenPlugin = {
  hide: () => resolvePlugin<SplashScreenPlugin>("SplashScreen", { hide: async () => {} }).hide(),
};

export const StatusBar: StatusBarPlugin = {
  hide: () => resolvePlugin<StatusBarPlugin>("StatusBar", {
    hide: async () => {},
    setOverlaysWebView: async () => {},
  }).hide(),
  setOverlaysWebView: (options) => resolvePlugin<StatusBarPlugin>("StatusBar", {
    hide: async () => {},
    setOverlaysWebView: async () => {},
  }).setOverlaysWebView(options),
};

export const PushNotifications: PushNotificationsPlugin = {
  createChannel: (channel) => resolvePlugin<PushNotificationsPlugin>("PushNotifications", {
    createChannel: async () => {},
    deleteChannel: async () => {},
    requestPermissions: async () => ({ receive: "denied" }),
    register: async () => {},
    addListener: async () => listenerHandle,
  }).createChannel?.(channel) ?? Promise.resolve(),
  deleteChannel: (options) => resolvePlugin<PushNotificationsPlugin>("PushNotifications", {
    createChannel: async () => {},
    deleteChannel: async () => {},
    requestPermissions: async () => ({ receive: "denied" }),
    register: async () => {},
    addListener: async () => listenerHandle,
  }).deleteChannel?.(options) ?? Promise.resolve(),
  requestPermissions: () => resolvePlugin<PushNotificationsPlugin>("PushNotifications", {
    createChannel: async () => {},
    deleteChannel: async () => {},
    requestPermissions: async () => ({ receive: "denied" }),
    register: async () => {},
    addListener: async () => listenerHandle,
  }).requestPermissions(),
  register: () => resolvePlugin<PushNotificationsPlugin>("PushNotifications", {
    createChannel: async () => {},
    deleteChannel: async () => {},
    requestPermissions: async () => ({ receive: "denied" }),
    register: async () => {},
    addListener: async () => listenerHandle,
  }).register(),
  addListener: (eventName, listenerFunc) => resolvePlugin<PushNotificationsPlugin>("PushNotifications", {
    createChannel: async () => {},
    deleteChannel: async () => {},
    requestPermissions: async () => ({ receive: "denied" }),
    register: async () => {},
    addListener: async () => listenerHandle,
  }).addListener(eventName, listenerFunc),
};

// ---------------- Local Notifications ----------------
type LocalNotificationsPlugin = {
  schedule: (options: { notifications: Array<Record<string, unknown>> }) => Promise<unknown>;
  requestPermissions: () => Promise<{ display: PermissionState }>;
};

const localNotificationsFallback: LocalNotificationsPlugin = {
  schedule: async () => ({}),
  requestPermissions: async () => ({ display: "denied" }),
};

export const LocalNotifications: LocalNotificationsPlugin = {
  schedule: (options) =>
    resolvePlugin<LocalNotificationsPlugin>("LocalNotifications", localNotificationsFallback).schedule(options),
  requestPermissions: () =>
    resolvePlugin<LocalNotificationsPlugin>("LocalNotifications", localNotificationsFallback).requestPermissions(),
};

// ---------------- Badge (@capawesome/capacitor-badge) ----------------
type BadgePlugin = {
  set: (options: { count: number }) => Promise<void>;
  clear: () => Promise<void>;
  isSupported: () => Promise<{ isSupported: boolean }>;
};

const badgeFallback: BadgePlugin = {
  set: async () => {},
  clear: async () => {},
  isSupported: async () => ({ isSupported: false }),
};

export const Badge: BadgePlugin = {
  set: (options) => resolvePlugin<BadgePlugin>("Badge", badgeFallback).set(options),
  clear: () => resolvePlugin<BadgePlugin>("Badge", badgeFallback).clear(),
  isSupported: () => resolvePlugin<BadgePlugin>("Badge", badgeFallback).isSupported(),
};

// ---------------- NativeSettings (capacitor-native-settings) ----------------
// Opciones válidas — mantenemos solo las que usamos.
// AndroidSettings.AppNotification / IOSSettings.App
type NativeSettingsPlugin = {
  open: (options: { optionAndroid?: string; optionIOS?: string }) => Promise<{ status: boolean }>;
};

const nativeSettingsFallback: NativeSettingsPlugin = {
  open: async () => ({ status: false }),
};

export const NativeSettings: NativeSettingsPlugin = {
  open: (options) => resolvePlugin<NativeSettingsPlugin>("NativeSettings", nativeSettingsFallback).open(options),
};

// Constantes que expone el plugin en runtime; los duplicamos aquí para no depender del import.
export const AndroidSettings = {
  AppNotification: "appNotification",
  App: "application",
} as const;

export const IOSSettings = {
  App: "application",
} as const;

// ---------------- Keyboard (@capacitor/keyboard) ----------------
type KeyboardInfo = { keyboardHeight: number };
type KeyboardPlugin = {
  addListener: (
    eventName: "keyboardWillShow" | "keyboardDidShow" | "keyboardWillHide" | "keyboardDidHide",
    listenerFunc: (info: KeyboardInfo) => void,
  ) => Promise<PluginListenerHandle>;
  setResizeMode?: (options: { mode: "none" | "native" | "body" | "ionic" }) => Promise<void>;
};

const keyboardFallback: KeyboardPlugin = {
  addListener: async () => listenerHandle,
  setResizeMode: async () => {},
};

export const Keyboard: KeyboardPlugin = {
  addListener: (eventName, listenerFunc) =>
    resolvePlugin<KeyboardPlugin>("Keyboard", keyboardFallback).addListener(eventName, listenerFunc),
  setResizeMode: (options) =>
    resolvePlugin<KeyboardPlugin>("Keyboard", keyboardFallback).setResizeMode?.(options) ?? Promise.resolve(),
};