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
    requestPermissions: async () => ({ receive: "denied" }),
    register: async () => {},
    addListener: async () => listenerHandle,
  }).createChannel?.(channel) ?? Promise.resolve(),
  requestPermissions: () => resolvePlugin<PushNotificationsPlugin>("PushNotifications", {
    createChannel: async () => {},
    requestPermissions: async () => ({ receive: "denied" }),
    register: async () => {},
    addListener: async () => listenerHandle,
  }).requestPermissions(),
  register: () => resolvePlugin<PushNotificationsPlugin>("PushNotifications", {
    createChannel: async () => {},
    requestPermissions: async () => ({ receive: "denied" }),
    register: async () => {},
    addListener: async () => listenerHandle,
  }).register(),
  addListener: (eventName, listenerFunc) => resolvePlugin<PushNotificationsPlugin>("PushNotifications", {
    createChannel: async () => {},
    requestPermissions: async () => ({ receive: "denied" }),
    register: async () => {},
    addListener: async () => listenerHandle,
  }).addListener(eventName, listenerFunc),
};