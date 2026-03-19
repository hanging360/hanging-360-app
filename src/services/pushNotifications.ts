import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

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
    console.log("Push registration token:", token.value);
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
