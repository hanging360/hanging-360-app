# Notificaciones Hanging360 — Canal único estable

La app Capacitor es un shell que carga `https://tech.hanging360.com/my-appointment`.
Toda la lógica de notificaciones vive en la PWA. El shell nativo solo expone:

- Un único **channel ID estable**: `hanging360_alerts` (Android)
- Sonido = `default` del sistema (no requiere archivos empaquetados)
- Bridge `postMessage` para badge y permisos

## Payload FCM (Android)

```json
{
  "message": {
    "token": "<device_token>",
    "notification": { "title": "...", "body": "..." },
    "android": {
      "notification": {
        "channel_id": "hanging360_alerts",
        "sound": "default",
        "notification_priority": "PRIORITY_HIGH"
      }
    },
    "data": { "type": "message" }
  }
}
```

## Payload APNs (iOS)

```json
{
  "aps": {
    "alert": { "title": "...", "body": "..." },
    "sound": "default",
    "badge": 1,
    "content-available": 1
  },
  "type": "message"
}
```

## Sonido in-app (PWA)

Cuando la app está abierta, el sonido lo reproduce la web:

```js
new Audio('/sounds/message.mp3').play().catch(() => {});
```

## Bridge desde la PWA al shell

```js
// Badge
window.parent?.postMessage({ type: "HANGING360_SET_BADGE", count: 3 }, "*");
window.parent?.postMessage({ type: "HANGING360_CLEAR_BADGE" }, "*");

// Registrar canal (solo Android, idempotente)
window.parent?.postMessage({ type: "HANGING360_REGISTER_CHANNELS" }, "*");

// Solicitar permisos
window.parent?.postMessage({ type: "HANGING360_REQUEST_PERMISSIONS" }, "*");
```

## Qué requiere nuevo IPA/AAB

Solo cambios nativos:
- `capacitor.config.ts`, `Info.plist`, `AndroidManifest.xml`, plugins nuevos,
  iconos/splash, versión de Capacitor, permisos nuevos, `server.url`.

Todo lo demás (contenido de notificaciones, sonidos in-app, badges, lógica) se
cambia editando la PWA y aparece al reabrir la app sin pasar por App Store/Play.
