## Objetivo
Dejar el shell nativo de Capacitor lo más "vacío" posible para que **todo** (teclado, sonidos, layout, versión) lo controle la PWA en `tech.hanging360.com`. Así, cambios futuros salen sin reconstruir IPA/AAB.

## Diagnóstico
Hoy el shell nativo está imponiendo comportamiento sobre la PWA:
- Configura el plugin `Keyboard` (resize/estilo) → colisiona con el manejo de teclado que ya hace bien la PWA.
- Android usa `adjustResize` + edge-to-edge + inmersivo → segundo resize sobre el WebView.
- iOS pone claves `KeyboardResize` en `Info.plist`.
- `MainActivity` y `AppDelegate` crean canales de notificación, categorías y sonidos → la PWA no puede cambiarlos sin rebuild.
- `LOAD_NO_CACHE` + `webView.reload()` / `reloadFromOrigin()` en cada arranque y foreground → fuerza recargas y afecta formularios/sesión, pero **no arregla** que Android/iOS cacheen HTML/JS por hashes ya guardados.

Como `server.url` apunta a la PWA, el shell no debe imponer política de UI ni de notificaciones: la PWA ya lo hace.

## Cambios (shell mínimo, un último rebuild y listo)

1. **Quitar el plugin Keyboard del shell**
   - `capacitor.config.ts`: eliminar el bloque `Keyboard` completo. Sin `resize`, sin `resizeOnFullScreen`, sin `style`.
   - No instalar/registrar `@capacitor/keyboard` desde el shell (la PWA maneja `visualViewport`/`100dvh`).

2. **Android sin resize duplicado y sin canales fijos**
   - `AndroidManifest.xml`: `android:windowSoftInputMode="adjustNothing"` en la Activity.
   - `MainActivity.java`: quitar creación de canales (`CHANNEL_ID` + `COMPAT_CHANNEL_IDS`) y quitar `webView.reload()` de `onCreate`/`onResume`. Los canales los crea la PWA vía plugins cuando envía notificaciones.
   - Conservar solo: permisos runtime, cookies/DOM storage, e inmersivo si se quiere pantalla completa.
   - Mantener `setCacheMode(LOAD_DEFAULT)` (revalidación normal HTTP); ya llega `Cache-Control: no-cache` desde la PWA.

3. **iOS sin claves de teclado y sin recargas forzadas**
   - `Info.plist`: eliminar `KeyboardResize` y `KeyboardResizeOnFullScreen`.
   - `AppDelegate.swift`: quitar `URLCache.removeAllCachedResponses`, `capacities=0`, `reloadFromOrigin()` y `revalidateRemotePortal()`. Quitar registro de categorías/opciones de presentación (la PWA lo pide vía `@capacitor/push-notifications` cuando corresponda).
   - Mantener solo lo estándar de Capacitor + delegate de push si la PWA lo usa.

4. **StatusBar/SplashScreen: valores neutros**
   - `capacitor.config.ts`: dejar `StatusBar` con overlays por defecto o quitarlo; quitar `PushNotifications.presentationOptions` y `LocalNotifications` (los define la PWA en tiempo de ejecución vía plugin).
   - SplashScreen queda igual (solo estética de arranque).

5. **AppShell.tsx (código muerto en build nativo)**
   - Al usar `server.url`, `AppShell.tsx` no se ejecuta en la app instalada. Eliminar la lógica de teclado/badge/bridge de ahí para evitar mantener dos fuentes de verdad. Dejar solo el fallback web (`window.location.assign(CLIENT_URL)`).

6. **Versión y actualización → responsabilidad de la PWA**
   - La PWA ya sirve `index.html` con `no-cache`. Añadir en la PWA `/version.json` real + check on `visibilitychange` + reload post-login (documentado ya en `NOTIFICATIONS_SETUP.md`). El shell **no** fuerza recargas.

## Resultado esperado
- Teclado: sin doble resize; el chat sube igual que en Safari/Chrome sobre `tech.hanging360.com`.
- Header pegado al display (sin gap) porque no manipulamos StatusBar/overlays desde el shell.
- Sonidos/canales/badges los define la PWA vía plugins → cambios sin rebuild.
- Sesión y permisos intactos (no borramos caché ni recargamos en foreground).
- Futuros ajustes de UI/notificación: solo desplegar la PWA.

## Publicación necesaria
Un **último** `git pull` + `npx cap sync` + rebuild IPA/AAB para aplicar el shell mínimo. Después de ese build, no se requieren más builds para cambios de la PWA.
