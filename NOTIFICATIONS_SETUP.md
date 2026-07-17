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
**Canal `hanging360_alerts_v2`** (MainActivity.java):
- `IMPORTANCE_HIGH` + `VISIBILITY_PUBLIC` (lock screen).
- `setShowBadge(true)` (dot en launcher).
- Sonido por defecto + vibración + luces.

**AndroidManifest.xml**:
- Meta `default_notification_channel_id = hanging360_alerts_v2`.
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
    "sound": "default",
    "channel_id": "hanging360_alerts_v2"
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
    "sound": "default",
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