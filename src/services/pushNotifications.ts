import { PushNotifications, LocalNotifications, Badge, isNativePlatform, getPlatform } from "../lib/capacitorPlugins";

const CHANNEL_ID = "hanging360_alerts_v2";
const CLIENT_ORIGIN = "https://tech.hanging360.com";

type PushRegistrationToken = {
  value?: string;
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

export async function clearBadge() {
  try { await Badge.clear(); } catch {}
}

export async function setBadgeCount(count: number) {
  try {
    if (count <= 0) await Badge.clear();
    else await Badge.set({ count });
  } catch {}
}

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

  // LocalNotifications permission (used to surface foreground pushes on Android)
  try { await LocalNotifications.requestPermissions(); } catch {}

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

  // Listen for push received while app is in foreground.
  // iOS ya lo muestra vía presentationOptions; en Android hay que forzarlo con LocalNotifications.
  PushNotifications.addListener("pushNotificationReceived", async (notification) => {
    console.log("Push received in foreground:", notification);
    if (getPlatform() !== "android") return;
    try {
      const n = (notification ?? {}) as Record<string, any>;
      const title = n.title ?? n.data?.title ?? "Hanging360";
      const body = n.body ?? n.data?.body ?? "";
      await LocalNotifications.schedule({
        notifications: [{
          id: Math.floor(Date.now() % 2147483647),
          title,
          body,
          channelId: CHANNEL_ID,
          smallIcon: "ic_stat_icon",
          sound: "default",
          extra: n.data ?? {},
        }],
      });
    } catch (e) {
      console.warn("LocalNotifications.schedule failed:", e);
    }
  });

  // Listen for push action (user tapped notification) — limpiar badge
  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    console.log("Push action performed:", action);
    clearBadge();
  });

  // Register with APNs / FCM after listeners are ready
  await PushNotifications.register();
}
