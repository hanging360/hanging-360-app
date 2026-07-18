import {
  PushNotifications,
  LocalNotifications,
  Badge,
  NativeSettings,
  AndroidSettings,
  IOSSettings,
  isNativePlatform,
  getPlatform,
} from "../lib/capacitorPlugins";
import {
  ALL_CHANNELS,
  NOTIFICATION_CHANNELS,
  NotificationType,
} from "../config/notificationChannels";

const CLIENT_ORIGIN = "https://tech.hanging360.com";

type InMsg =
  | { type: "HANGING360_PING"; requestId?: string }
  | { type: "HANGING360_PLAY_SOUND"; url?: string; requestId?: string }
  | { type: "HANGING360_OPEN_APP_SETTINGS"; requestId?: string }
  | { type: "HANGING360_OPEN_NOTIFICATION_SETTINGS"; requestId?: string }
  | { type: "HANGING360_REGISTER_CHANNELS"; requestId?: string }
  | { type: "HANGING360_TEST_LOCAL_NOTIFICATION"; notificationType?: NotificationType; requestId?: string }
  | { type: "HANGING360_SET_BADGE"; count: number; requestId?: string }
  | { type: "HANGING360_CLEAR_BADGE"; requestId?: string }
  | { type: "HANGING360_REQUEST_PERMISSIONS"; requestId?: string };

let installed = false;
let targetWindowRef: Window | null | undefined = null;

function reply(requestId: string | undefined, ok: boolean, extra?: Record<string, unknown>) {
  if (!targetWindowRef) return;
  targetWindowRef.postMessage(
    { type: "HANGING360_ACK", requestId, ok, ...extra },
    CLIENT_ORIGIN,
  );
}

export async function registerAllChannels() {
  if (!isNativePlatform()) return;
  if (getPlatform() !== "android") return;

  // Limpieza única de canales versionados antiguos. Después de esta migración
  // usamos un único canal estable `hanging360_alerts` con sonido default.
  const migrationKey = "hanging360_notification_channels_stable";
  const legacyIds = [
    "hanging360_alerts_v2", "hanging360_alerts_v3", "hanging360_alerts_v4", "hanging360_alerts_v5",
    "hanging360_message", "hanging360_message_v3", "hanging360_message_v4", "hanging360_message_v5",
    "hanging360_whatsapp", "hanging360_whatsapp_v3", "hanging360_whatsapp_v4", "hanging360_whatsapp_v5",
    "hanging360_appointment_new", "hanging360_appointment_new_v3", "hanging360_appointment_new_v4", "hanging360_appointment_new_v5",
    "hanging360_appointment_update", "hanging360_appointment_update_v3", "hanging360_appointment_update_v4", "hanging360_appointment_update_v5",
    "hanging360_payment", "hanging360_payment_v3", "hanging360_payment_v4", "hanging360_payment_v5",
    "hanging360_update", "hanging360_update_v3", "hanging360_update_v4", "hanging360_update_v5",
  ];
  if (window.localStorage.getItem(migrationKey) !== "done") {
    for (const id of legacyIds) {
      try { await PushNotifications.deleteChannel?.({ id }); } catch {}
    }
  }

  for (const c of ALL_CHANNELS) {
    try {
      await PushNotifications.createChannel?.({
        id: c.id,
        name: c.name,
        description: c.description,
        importance: c.importance,
        visibility: c.visibility,
        sound: "default",
        vibration: c.vibration,
        lights: c.lights,
      });
    } catch (e) {
      console.warn("createChannel failed for", c.id, e);
    }
  }
  window.localStorage.setItem(migrationKey, "done");
}

async function handle(msg: InMsg) {
  switch (msg.type) {
    case "HANGING360_PING":
      reply(msg.requestId, true, {
        pong: true,
        platform: getPlatform(),
        features: ["channels", "badge", "openSettings", "testNotification", "playSound"],
      });
      return;

    case "HANGING360_OPEN_APP_SETTINGS":
      try {
        await NativeSettings.open({
          optionAndroid: AndroidSettings.App,
          optionIOS: IOSSettings.App,
        });
        reply(msg.requestId, true);
      } catch (e) {
        reply(msg.requestId, false, { error: String(e) });
      }
      return;

    case "HANGING360_OPEN_NOTIFICATION_SETTINGS":
      try {
        await NativeSettings.open({
          optionAndroid: AndroidSettings.AppNotification,
          optionIOS: IOSSettings.App, // iOS no expone la sub-página; abrimos ajustes de la app
        });
        reply(msg.requestId, true);
      } catch (e) {
        reply(msg.requestId, false, { error: String(e) });
      }
      return;

    case "HANGING360_REGISTER_CHANNELS":
      await registerAllChannels();
      reply(msg.requestId, true, { count: ALL_CHANNELS.length });
      return;

    case "HANGING360_TEST_LOCAL_NOTIFICATION": {
      const t: NotificationType = msg.notificationType ?? "message";
      const cfg = NOTIFICATION_CHANNELS[t] ?? NOTIFICATION_CHANNELS.message;
      try {
        await LocalNotifications.requestPermissions();
        const platform = getPlatform();
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Date.now() % 2147483647),
              title: `Prueba: ${cfg.name}`,
              body: "Notificación de prueba desde ajustes",
              channelId: platform === "android" ? cfg.id : undefined,
              smallIcon: "ic_stat_icon",
              sound: undefined,
              extra: { type: t, category: t },
            },
          ],
        });
        reply(msg.requestId, true);
      } catch (e) {
        reply(msg.requestId, false, { error: String(e) });
      }
      return;
    }

    case "HANGING360_SET_BADGE":
      try {
        if (msg.count <= 0) await Badge.clear();
        else await Badge.set({ count: msg.count });
        reply(msg.requestId, true);
      } catch (e) {
        reply(msg.requestId, false, { error: String(e) });
      }
      return;

    case "HANGING360_CLEAR_BADGE":
      try {
        await Badge.clear();
        reply(msg.requestId, true);
      } catch (e) {
        reply(msg.requestId, false, { error: String(e) });
      }
      return;

    case "HANGING360_REQUEST_PERMISSIONS":
      try {
        const push = await PushNotifications.requestPermissions();
        await LocalNotifications.requestPermissions();
        if (push.receive === "granted") await PushNotifications.register();
        reply(msg.requestId, push.receive === "granted", { permission: push.receive });
      } catch (e) {
        reply(msg.requestId, false, { error: String(e) });
      }
      return;

    case "HANGING360_PLAY_SOUND":
      // El shell no puede reproducir audio dentro del iframe remoto;
      // el web app debe usar HTMLAudioElement. Solo confirmamos capacidad.
      reply(msg.requestId, true, { note: "play with HTMLAudioElement inside web app" });
      return;
  }
}

export function installWebBridge(targetWindow: Window | null | undefined) {
  targetWindowRef = targetWindow;
  if (installed) return;
  installed = true;

  window.addEventListener("message", (e: MessageEvent) => {
    const data = e.data as InMsg | undefined;
    if (!data || typeof data !== "object" || typeof (data as any).type !== "string") return;
    if (!(data as any).type.startsWith("HANGING360_")) return;
    void handle(data);
  });
}

export function setBridgeTarget(win: Window | null | undefined) {
  targetWindowRef = win;
}