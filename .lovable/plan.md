# Plan: Notificaciones completas (Push + Local) iOS + Android + Codemagic

Objetivo: dejar Capacitor configurado para **badge, sonido, vibración, banners/alertas, lock screen y notificaciones en foreground**, tanto push (APNs/FCM) como locales, en iOS y Android. Actualizar los pipelines de Codemagic para que el IPA/AAB nuevo incluya los recursos (sonidos, iconos monocromo, plugins nuevos). Sin tocar la lógica de negocio del portal remoto.

## 1. Dependencias nuevas
`package.json`:
- `@capacitor/local-notifications` — banners/sonido en foreground Android + programación local
- `@capacitor/app` — control de estado + `setBadgeCount` iOS
- `@capacitor-community/badge` — badge en Android

El usuario correrá `npm install && npx cap sync` en local; Codemagic ya lo hace.

## 2. `capacitor.config.ts`
```ts
plugins: {
  PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
  LocalNotifications: {
    smallIcon: 'ic_stat_icon',
    iconColor: '#000000',
    sound: 'default'
  }
}
```

## 3. iOS nativo
### a) `ios/App/App/Info.plist`
- Añadir `NSUserNotificationUsageDescription` (mensaje al usuario).
- Confirmar `UIBackgroundModes` incluye `remote-notification` (ya está).

### b) `App.entitlements`
- Verificar `aps-environment` (ya definido vía variable). Para IPA de App Store debe resolver a `production`.

### c) `AppDelegate.swift`
- Adoptar `UNUserNotificationCenterDelegate`.
- `UNUserNotificationCenter.current().delegate = self` en `didFinishLaunchingWithOptions`.
- `willPresent` → `[.banner, .list, .sound, .badge]` para foreground.
- Limpiar `applicationIconBadgeNumber` al `applicationDidBecomeActive`.

### d) Sonidos custom (opcional)
- Documentar cómo dropear `notification.caf` en el target si el backend manda `sound: "notification.caf"`. No incluimos assets por ahora — solo dejamos el hook.

## 4. Android nativo
### a) `MainActivity.java`
El canal `hanging360_alerts_v2` existe. Endurecer:
- `IMPORTANCE_HIGH` (ya).
- `setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC)` → visible en lock screen.
- `setShowBadge(true)` → punto en launcher.
- Segundo canal `hanging360_silent` (opcional) para avisos silenciosos.

### b) `AndroidManifest.xml`
- Meta `com.google.firebase.messaging.default_notification_icon` → `@drawable/ic_stat_icon` (monocromo).
- Meta `com.google.firebase.messaging.default_notification_color` → color de acento.
- Mantener `default_notification_channel_id` (ya está).

### c) Recurso `drawable/ic_stat_icon.xml`
- Crear silueta blanca del logo (VectorDrawable). Sin esto, Android muestra un cuadrado blanco.

## 5. Frontend (`src/`)
### a) `src/lib/capacitorPlugins.ts`
- Wrappers `LocalNotifications`, `Badge`, `App` con fallbacks noop web (patrón `resolvePlugin`).

### b) `src/services/pushNotifications.ts`
- En `pushNotificationReceived` (foreground): `LocalNotifications.schedule(...)` en Android para forzar banner + sonido; iOS lo hace vía `presentationOptions`.
- En `pushNotificationActionPerformed`: `Badge.clear()` + `App` badge reset.
- Exponer `clearBadge()` / `setBadgeCount(n)`.

### c) `AppShell.tsx`
- Al montar y en `visibilitychange → visible`: `clearBadge()`.
- Escuchar `message` del iframe:
  - `type: "HANGING360_SET_BADGE", count` → `setBadgeCount(count)`.
  - `type: "HANGING360_CLEAR_BADGE"` → `clearBadge()`.

## 6. Codemagic (`codemagic.yaml`)
Actualizar ambos workflows para que los nuevos plugins queden linkeados y los recursos incluidos.

### a) `capacitor_ios_release`
- Subir `MARKETING_VERSION` a `0.4` (nueva build con notificaciones).
- Después de `npm install`, forzar `pod repo update` para captar specs nuevos:
  ```yaml
  - name: Install CocoaPods dependencies
    script: |
      cd ios/App
      pod install --repo-update
      cd ../..
  ```
- Añadir un paso `Verify notification plugins`:
  ```yaml
  - name: Verify notification plugins
    script: |
      ls ios/App/Pods | grep -E "CapacitorPushNotifications|CapacitorLocalNotifications|CapacitorApp|CapacitorCommunityBadge" || (echo "Missing notification pods" && exit 1)
  ```
- Añadir a `cache_paths`: `- node_modules` (opcional, acelera).

### b) Nuevo workflow `capacitor_android_release`
Se agrega en el mismo `codemagic.yaml`:
```yaml
capacitor_android_release:
  name: Capacitor Android Release
  max_build_duration: 120
  environment:
    java: 21
    node: 20
    vars:
      PACKAGE_NAME: "com.hanging360.app"
      VERSION_NAME: "0.4"
    android_signing:
      - hanging360_keystore   # referencia al keystore subido en Codemagic
  cache:
    cache_paths:
      - ~/.npm
      - ~/.gradle/caches
      - android/.gradle
  scripts:
    - name: Install JS deps
      script: npm install --no-audit --no-fund --legacy-peer-deps
    - name: Build web
      script: npm run build
    - name: Sync Capacitor Android
      script: npx cap sync android
    - name: Set version
      script: |
        cd android
        ./gradlew :app:assembleRelease -PversionName=$VERSION_NAME -PversionCode=$BUILD_NUMBER
    - name: Build signed AAB
      script: |
        cd android
        ./gradlew bundleRelease
  artifacts:
    - android/app/build/outputs/**/*.aab
    - android/app/build/outputs/**/*.apk
  publishing:
    email:
      recipients: [cubanito_com@yahoo.com]
      notify: { success: true, failure: true }
```
Nota: si el usuario aún no ha subido keystore a Codemagic, marcamos ese paso como TODO en el reporte.

## 7. Reporte
Crear `NOTIFICATIONS_SETUP.md` con:
- Cambios por plataforma.
- Payload de ejemplo FCM y APNs (`channel_id`, `sound`, `badge`, `content-available`).
- Cómo probar (curl a FCM + push de prueba desde Apple Push Console).
- Comandos: `git pull && npm install && npx cap sync`.
- Nota Codemagic: subir keystore Android en Settings → Code signing con referencia `hanging360_keystore`.

## Detalles técnicos
- Sin cambios a lógica del portal remoto. El portal solo debe:
  - Reusar el token push que ya recibe por `postMessage HANGING360_PUSH_TOKEN`.
  - Opcionalmente postear `HANGING360_SET_BADGE` cuando cambie el conteo no leído.
- Payload FCM: `notification.channel_id = "hanging360_alerts_v2"`, `notification.sound = "default"`.
- Payload APNs: `"aps": { "alert": {...}, "sound": "default", "badge": N }`.
- No se toca RBAC, auth, edge functions ni Supabase.
