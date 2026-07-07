## Problemas

1. **Las notificaciones push no suenan** en el APK instalado.
2. **La barra de navegación nativa de Android sigue visible** y tapa el diálogo de chat y otros botones. El `StatusBar.hide()` de JS solo oculta la barra de estado, no la de navegación, y Android la vuelve a mostrar en cuanto el usuario toca la pantalla.

Ambos requieren cambios en el proyecto nativo `android/`, no solo en el JS.

## Cambios propuestos

### 1. Modo inmersivo real (oculta status bar + navigation bar de forma persistente)

- **`MainActivity.java`**: sobreescribir `onCreate` y `onWindowFocusChanged` para aplicar *immersive sticky* con `WindowInsetsControllerCompat` (API 30+) y fallback a `SYSTEM_UI_FLAG_IMMERSIVE_STICKY` (API < 30). Esto reoculta las barras cada vez que el usuario hace swipe.
- **`styles.xml`**: en `AppTheme.NoActionBar` añadir `windowFullscreen=true`, `windowTranslucentNavigation=true` y `windowLayoutInDisplayCutoutMode=shortEdges` para que el WebView ocupe toda la pantalla incluyendo notch.
- **`AndroidManifest.xml`**: cambiar el tema de la actividad de `AppTheme.NoActionBarLaunch` (solo splash) a `AppTheme.NoActionBar` una vez arrancada, y añadir `android:windowSoftInputMode="adjustResize"` para que el teclado no tape el input del chat.
- **`AppShell.tsx`**: mantener las llamadas a `StatusBar.hide()` como refuerzo, pero el trabajo real lo hace el código nativo.

### 2. Sonido en notificaciones push

- **`AndroidManifest.xml`**:
  - Añadir permisos: `POST_NOTIFICATIONS`, `VIBRATE`, `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`.
  - Añadir meta-data `com.google.firebase.messaging.default_notification_channel_id` apuntando a un canal `hanging360_default`.
- **Crear canal de notificación con sonido** en `MainActivity.java` (en `onCreate`), con `IMPORTANCE_HIGH`, sonido por defecto del sistema (`RingtoneManager.TYPE_NOTIFICATION`) y vibración. Sin canal, Android 8+ ignora el sonido.
- **`pushNotifications.ts`**: al recibir el token, registrar también el canal via `PushNotifications.createChannel(...)` como respaldo desde JS.

> Nota: para que las push realmente lleguen sigue haciendo falta `google-services.json` de Firebase en `android/app/`. Si aún no lo tienes, el sonido tampoco sonará porque no llega la notificación. Confírmame si ya está subido.

## Detalles técnicos

- Archivos a editar:
  - `android/app/src/main/java/com/hanging360/tech/MainActivity.java`
  - `android/app/src/main/res/values/styles.xml`
  - `android/app/src/main/AndroidManifest.xml`
  - `src/services/pushNotifications.ts`
- Sin cambios en `capacitor.config.ts` ni en `package.json`.
- Tras aplicar, el usuario debe hacer `git pull`, `npm install`, `npx cap sync android` y reconstruir el APK — los cambios nativos no se propagan por hot-reload.

## Pregunta antes de implementar

¿Tienes ya `google-services.json` colocado en `android/app/`? Si no, el sonido no es el bloqueante real: primero hay que configurar Firebase Cloud Messaging o las push no llegan.
