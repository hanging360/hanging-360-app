# Notificaciones Hanging360 — Setup completo iOS + Android

Este documento resume la configuración de push + local notifications con **badge, sonido, vibración, banners y visibilidad en lock screen** para la app Capacitor.

## Plugins instalados
- `@capacitor/push-notifications` — APNs / FCM
- `@capacitor/local-notifications` — banners/sonido en foreground (Android) + scheduling local
- `@capacitor/app` — ciclo de vida
- `@capawesome/capacitor-badge` — badge count multiplataforma

## iOS
**`AppDelegate.swift`**
- Adopta `UNUserNotificationCenterDelegate`.
- `willPresent` → `[.banner, .list, .sound, .badge]` (muestra la notificación aunque la app esté en foreground).
- `didReceive` y `applicationDidBecomeActive` limpian `applicationIconBadgeNumber`.

**`Info.plist`**
- `NSUserNotificationUsageDescription` añadido.
- `UIBackgroundModes = remote-notification` (ya presente).

**Sonidos custom (opcional)**: dropear `notification.caf` en el target Xcode y en el payload APNs mandar `"sound": "notification.caf"`.

## Android
**Canal `hanging360_alerts_v3`** (MainActivity.java):
- `IMPORTANCE_HIGH` + `VISIBILITY_PUBLIC` (lock screen).
- `setShowBadge(true)` (dot en launcher).
- Sonido por defecto + vibración + luces.

**AndroidManifest.xml**:
- Meta `default_notification_channel_id = hanging360_alerts_v3`.
- Meta `default_notification_icon = @drawable/ic_stat_icon` (silueta monocromo — evita cuadro blanco).
- Meta `default_notification_color = @color/notification_color`.

## Frontend
- `src/lib/capacitorPlugins.ts` — wrappers `LocalNotifications` + `Badge` con fallbacks noop.
- `src/services/pushNotifications.ts` — en foreground Android hace `LocalNotifications.schedule` para forzar banner + sonido; al tap limpia badge. Exporta `clearBadge()` / `setBadgeCount(n)`.
- `AppShell.tsx` — limpia badge al entrar en foreground y escucha `postMessage` del portal:
  - `{ type: "HANGING360_SET_BADGE", count: N }`
  - `{ type: "HANGING360_CLEAR_BADGE" }`

## Payloads recomendados desde el backend
**FCM (Android)**
```json
{
  "to": "<token>",
  "notification": {
    "title": "Nueva cita",
    "body": "Tu cita ha sido confirmada",
    "sound": "appointment",
    "channel_id": "hanging360_appointment_new_v3"
  },
  "data": { "route": "/my-appointment" },
  "android": { "priority": "high" }
}
```

**APNs (iOS)**
```json
{
  "aps": {
    "alert": { "title": "Nueva cita", "body": "Tu cita ha sido confirmada" },
    "sound": "appointment.caf",
    "badge": 1,
    "content-available": 1
  },
  "route": "/my-appointment"
}
```

## Codemagic
- **iOS workflow** `capacitor_ios_release`:
  - `MARKETING_VERSION` → `0.4`.
  - El proyecto iOS usa **Swift Package Manager** (no CocoaPods). Para añadir un plugin nativo hay que editar `ios/App/CapApp-SPM/Package.swift` (agregar `.package` en `dependencies` y `.product` en el target) y luego correr `npx cap sync ios`.
  - Paso `Verify notification plugins` que valida que los 4 paquetes estén declarados en `Package.swift` y resuelve dependencias SPM con `xcodebuild -resolvePackageDependencies`.
- **Android workflow nuevo** `capacitor_android_release`:
  - Requiere subir un keystore en Codemagic → Settings → Code signing con referencia `hanging360_keystore`.
  - Genera `.aab` + `.apk` firmados.

## Comandos para el usuario
```bash
git pull
npm install
npx cap sync
```
Luego compilar en Codemagic (o en local: `npx cap run ios` / `npx cap run android`).

## Prueba rápida
- iOS: usar Apple Push Console (o `apns-tool`) enviando el payload APNs de arriba.
- Android: `curl` a FCM v1 con el payload de arriba.
- Verificar: banner en foreground, sonido, badge incrementa, notificación visible en lock screen.

---

## 🌉 Puente WebView ⇄ Shell nativo (para el web app remoto en `tech.hanging360.com`)

El shell Capacitor escucha `window.postMessage` desde el iframe del web app. **Todos** los mensajes deben tener `type` que empiece por `HANGING360_` y ser enviados con `target = window.parent`, `targetOrigin = "*"` (el shell filtra por tipo).

### Detección de shell
```js
// El web app envía:
window.parent.postMessage({ type: "HANGING360_PING", requestId: "abc" }, "*");
// El shell responde en window "message":
// { type: "HANGING360_ACK", requestId: "abc", ok: true, pong: true, platform: "ios"|"android",
//   features: ["channels","badge","openSettings","testNotification","playSound"] }
```
Si no llega respuesta en ~300ms → asumir que corre en navegador y ocultar botones nativos.

### Mensajes soportados
| type | payload | efecto |
|------|---------|--------|
| `HANGING360_PING` | `{ requestId }` | responde con `pong` + platform |
| `HANGING360_OPEN_APP_SETTINGS` | `{ requestId }` | abre ajustes de la app en el SO |
| `HANGING360_OPEN_NOTIFICATION_SETTINGS` | `{ requestId }` | Android: ajustes de notificaciones de la app; iOS: ajustes de la app |
| `HANGING360_REGISTER_CHANNELS` | `{ requestId }` | crea todos los canales Android por tipo |
| `HANGING360_TEST_LOCAL_NOTIFICATION` | `{ requestId, notificationType }` | dispara notificación local del tipo dado (ver tabla) |
| `HANGING360_SET_BADGE` | `{ requestId, count }` | badge del icono |
| `HANGING360_CLEAR_BADGE` | `{ requestId }` | limpia badge |
| `HANGING360_REQUEST_PERMISSIONS` | `{ requestId }` | vuelve a pedir permisos |
| `HANGING360_PLAY_SOUND` | `{ requestId, url }` | ack (el web app debe reproducir con `new Audio(url)` dentro del iframe — WebView permite audio) |

### Botón "Play" en la pantalla Settings
```js
const audio = new Audio("/sounds/message.mp3"); // asset servido por el web app
audio.play().catch(err => console.warn("no autoplay:", err));
```
Requiere gesto del usuario (tap). Funciona en iOS/Android WebView.

### Botón "Open system settings"
```js
window.parent.postMessage({ type: "HANGING360_OPEN_NOTIFICATION_SETTINGS", requestId: crypto.randomUUID() }, "*");
```

### Tipos de notificación (canales Android / categorías iOS)
| notificationType | Android channelId | iOS sound (payload APNs) | uso |
|------------------|-------------------|--------------------------|-----|
| `message`             | `hanging360_message_v3`             | `message.caf`     | mensaje de cliente |
| `whatsapp`            | `hanging360_whatsapp_v3`            | `whatsapp.caf`    | mensaje entrante WhatsApp |
| `appointment_new`     | `hanging360_appointment_new_v3`     | `appointment.caf` | nueva cita creada |
| `appointment_update`  | `hanging360_appointment_update_v3`  | `appointment.caf` | update/cancel de cita |
| `payment`             | `hanging360_payment_v3`              | `payment.caf`     | pago recibido |
| `update`              | `hanging360_update_v3`               | `update.caf`      | avisos generales |

### Payload push por tipo
**FCM (Android)** — el backend debe mandar `channel_id` y `type` en `data`:
```json
{
  "to": "<token>",
  "notification": { "title": "Nuevo pago", "body": "Recibiste $50", "channel_id": "hanging360_payment_v3", "sound": "payment" },
  "data": { "type": "payment", "route": "/payments", "badge": "3" },
  "android": { "priority": "high" }
}
```

**APNs (iOS)** — usar `sound` = archivo `.caf` empaquetado en el binario, o `default`:
```json
{
  "aps": {
    "alert": { "title": "Nuevo pago", "body": "Recibiste $50" },
    "sound": "payment.caf",
    "badge": 3
  },
  "type": "payment",
  "route": "/payments"
}
```

### Archivos de sonido custom
Empaquetar los `.mp3` (Android) y `.caf` (iOS) del catálogo en:
- `android/app/src/main/res/raw/<name>.mp3` — nombre en minúsculas, sin espacios.
- iOS: añadir `.caf` al target Xcode → "Copy Bundle Resources".
Sin estos archivos, el sistema usa el tono por defecto cuando la app está cerrada.

## 🔐 Guardar credenciales de login (web app remoto)

El shell conserva DOM storage/cookies en WKWebView / Android WebView y habilita Autofill. Para que aparezca el prompt "Guardar contraseña", el **formulario del web app** debe:

```html
<form>
  <input type="email" name="username" autocomplete="username" />
  <input type="password" name="password" autocomplete="current-password" />
  <button type="submit">Entrar</button>
</form>
```

- Sin `autocomplete="username"` + `current-password` iOS/Android **no** ofrecerán guardar.
- Después de un login correcto, el portal debe conservar la sesión Supabase (`persistSession: true`) y no navegar a `/login` hasta terminar la carga inicial de autenticación.
- Para autofill nativo en iOS por dominio, publicar en `https://tech.hanging360.com/.well-known/apple-app-site-association` el bloque `webcredentials` con el appID `TEAMID.com.hanging360.app`.