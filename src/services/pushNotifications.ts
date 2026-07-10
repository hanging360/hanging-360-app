import { PushNotifications, isNativePlatform } from "../lib/capacitorPlugins";

const CHANNEL_ID = "hanging360_alerts_v2";
const CLIENT_ORIGIN = "https://tech.hanging360.com";

type PushRegistrationToken = {
  value?: string;
};

const getPlatform = () => {
  const capacitor = (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  return capacitor?.getPlatform?.() ?? "unknown";
};

const sendPushTokenToWebApp = (targetWindow: Window | null | undefined, token: string) => {
  const payload = {
    type: "HANGING360_PUSH_TOKEN",
    token,
    platform: getPlatform(),
    channelId: CHANNEL_ID,
  };

  window.localStorage.setItem("hanging360_push_token", token);
  window.localStorage.setItem("hanging360_push_platform", payload.platform);
  targetWindow?.postMessage(payload, CLIENT_ORIGIN);
};

export const postStoredPushTokenToWebApp = (targetWindow: Window | null | undefined) => {
  const token = window.localStorage.getItem("hanging360_push_token");
  if (!token) return;

  sendPushTokenToWebApp(targetWindow, token);
};

export async function initPushNotifications(targetWindow?: Window | null) {
  if (!isNativePlatform()) return;

  // Ensure a high-importance channel with sound exists (Android 8+)
  try {
    if (PushNotifications.createChannel) {
      await PushNotifications.createChannel({
        id: CHANNEL_ID,
        name: "Notificaciones Hanging360",
        description: "Avisos de citas y mensajes",
        importance: 5,
        visibility: 1,
        sound: "default",
        vibration: true,
        lights: true,
      });
    }
  } catch (e) {
    console.warn("createChannel failed:", e);
  }

  // Request permission
  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== "granted") {
    console.warn("Push notification permission not granted");
    return;
  }

  // Listen for registration success
  PushNotifications.addListener("registration", (token) => {
    const value = typeof token === "object" && token && "value" in token ? (token as PushRegistrationToken).value : undefined;
    if (!value) return;

    sendPushTokenToWebApp(targetWindow, value);
    console.log("Push registration token received");
  });

  // Listen for registration errors
  PushNotifications.addListener("registrationError", (error) => {
    console.error("Push registration error:", error);
  });

  // Listen for push received while app is in foreground
  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("Push received in foreground:", notification);
  });

  // Listen for push action (user tapped notification)
  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    console.log("Push action performed:", action);
  });

  // Register with APNs / FCM after listeners are ready
  await PushNotifications.register();
}
