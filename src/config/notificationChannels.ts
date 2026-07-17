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

export const NOTIFICATION_CHANNELS: Record<NotificationType, ChannelConfig> = {
  message: {
    id: "hanging360_message_v3",
    name: "Mensajes",
    description: "Nuevos mensajes de clientes",
    importance: 5,
    visibility: 1,
    soundAndroid: "message",
    soundIOS: "message.caf",
    vibration: true,
    lights: true,
  },
  whatsapp: {
    id: "hanging360_whatsapp_v3",
    name: "WhatsApp",
    description: "Mensajes entrantes de WhatsApp",
    importance: 5,
    visibility: 1,
    soundAndroid: "whatsapp",
    soundIOS: "whatsapp.caf",
    vibration: true,
    lights: true,
  },
  appointment_new: {
    id: "hanging360_appointment_new_v3",
    name: "Nueva cita",
    description: "Se ha creado una cita nueva",
    importance: 5,
    visibility: 1,
    soundAndroid: "appointment",
    soundIOS: "appointment.caf",
    vibration: true,
    lights: true,
  },
  appointment_update: {
    id: "hanging360_appointment_update_v3",
    name: "Cambios de cita",
    description: "Actualizaciones o cancelaciones de citas",
    importance: 4,
    visibility: 1,
    soundAndroid: "appointment",
    soundIOS: "appointment.caf",
    vibration: true,
    lights: false,
  },
  payment: {
    id: "hanging360_payment_v3",
    name: "Pagos",
    description: "Confirmaciones y recibos de pago",
    importance: 5,
    visibility: 1,
    soundAndroid: "payment",
    soundIOS: "payment.caf",
    vibration: true,
    lights: true,
  },
  update: {
    id: "hanging360_update_v3",
    name: "Actualizaciones",
    description: "Novedades y avisos generales",
    importance: 3,
    visibility: 1,
    soundAndroid: "update",
    soundIOS: "update.caf",
    vibration: false,
    lights: false,
  },
};

export const ALL_CHANNELS: ChannelConfig[] = Object.values(NOTIFICATION_CHANNELS);

// Canal genérico legacy (retro-compat)
export const LEGACY_CHANNEL_ID = "hanging360_alerts_v3";

export function resolveTypeFromPayload(payload: any): NotificationType {
  const raw =
    payload?.data?.type ??
    payload?.data?.category ??
    payload?.data?.channel_id ??
    payload?.type ??
    "update";
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