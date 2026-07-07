import { PushNotifications, isNativePlatform } from "../lib/capacitorPlugins";

export async function initPushNotifications() {
  if (!isNativePlatform()) return;

  // Ensure a high-importance channel with sound exists (Android 8+)
  try {
    if (typeof (PushNotifications as any).createChannel === "function") {
      await (PushNotifications as any).createChannel({
        id: "hanging360_default",
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

  // Register with APNs / FCM
  await PushNotifications.register();

  // Listen for registration success
  PushNotifications.addListener("registration", (token) => {
    const value = typeof token === "object" && token && "value" in token ? token.value : undefined;
    console.log("Push registration token:", value);
    // TODO: Send token.value to your backend (e.g. POST to /push/register)
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
}
