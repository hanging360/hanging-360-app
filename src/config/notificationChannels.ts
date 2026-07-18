// Canales/categorías de notificación por tipo. Fuente única de la verdad
// para Android (channelId) e iOS (categoryId + sound del payload APNs).

export type NotificationType =
  | "message"
  | "whatsapp"
  | "appointment_new"
  | "appointment_update"
  | "payment"
  | "update";

export type ChannelConfig = {
  id: string;
  name: string;
  description: string;
  importance: 1 | 2 | 3 | 4 | 5; // 5 = HIGH
  visibility: -1 | 0 | 1; // 1 = PUBLIC (lock screen)
  soundAndroid: string; // filename (sin extensión, en res/raw) o 'default'
  soundIOS: string; // filename con extensión (.caf) o 'default'
  vibration: boolean;
  lights: boolean;
};

// Canal único estable. Todos los tipos comparten el mismo channelId para que
// el backend no necesite conocer sufijos versionados y para que Android no
// tenga que recrear canales (el sonido se congela al crearse).
export const STABLE_CHANNEL_ID = "hanging360_alerts";

const baseChannel = (
  name: string,
  description: string,
  importance: ChannelConfig["importance"] = 5,
): ChannelConfig => ({
  id: STABLE_CHANNEL_ID,
  name,
  description,
  importance,
  visibility: 1,
  soundAndroid: "default",
  soundIOS: "default",
  vibration: true,
  lights: true,
});

export const NOTIFICATION_CHANNELS: Record<NotificationType, ChannelConfig> = {
  message: baseChannel("Mensajes", "Nuevos mensajes de clientes"),
  whatsapp: baseChannel("WhatsApp", "Mensajes entrantes de WhatsApp"),
  appointment_new: baseChannel("Nueva cita", "Se ha creado una cita nueva"),
  appointment_update: baseChannel("Cambios de cita", "Actualizaciones o cancelaciones de citas", 4),
  payment: baseChannel("Pagos", "Confirmaciones y recibos de pago"),
  update: baseChannel("Actualizaciones", "Novedades y avisos generales", 3),
};

export const ALL_CHANNELS: ChannelConfig[] = [
  baseChannel("Notificaciones Hanging360", "Avisos de citas, mensajes y pagos"),
];

// Canal genérico legacy (retro-compat con backend antiguo)
export const LEGACY_CHANNEL_ID = STABLE_CHANNEL_ID;

export function resolveTypeFromPayload(payload: any): NotificationType {
  const raw =
    payload?.data?.type ??
    payload?.data?.category ??
    payload?.data?.channel_id ??
    payload?.type ??
    "message";
  const key = String(raw).toLowerCase().trim();
  if (key in NOTIFICATION_CHANNELS) return key as NotificationType;
  const aliases: Record<string, NotificationType> = {
    appointment: "appointment_new",
    new_appointment: "appointment_new",
    appointment_created: "appointment_new",
    appointment_changed: "appointment_update",
    appointment_cancelled: "appointment_update",
    messages: "message",
    payments: "payment",
    system: "update",
    general: "update",
  };
  if (aliases[key]) return aliases[key];

  // Aceptar IDs actuales y anteriores enviados por el backend.
  const channelKey = key.replace(/_v\d+$/, "");
  const found = (Object.keys(NOTIFICATION_CHANNELS) as NotificationType[]).find(
    (type) => NOTIFICATION_CHANNELS[type].id.replace(/_v\d+$/, "") === channelKey,
  );
  if (found) return found;
  return "update";
}