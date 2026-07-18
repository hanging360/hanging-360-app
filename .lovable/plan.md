## Objetivo

Arreglar dos regresiones en la app nativa (iOS + Android):

1. Después del login, la sesión y la configuración por dispositivo del portal remoto (`tech.hanging360.com`) se pierden: micrófono queda apagado, la burbuja del asistente "Cesar AI" vuelve a la posición por defecto y "recordarme" no funciona.
2. Desde que se agregaron los sonidos personalizados (`message.mp3`, `whatsapp.mp3`, `appointment.mp3`, `payment.mp3`) las notificaciones dejaron de sonar; incluso el default de Apple/Android ya no suena.

Todo debe funcionar con la build actual **sin depender de una nueva versión en las stores para el punto 2** (volvemos al sonido por defecto ya).

---

## Diagnóstico

**Persistencia de sesión / ajustes de usuario**

El shell nativo carga `tech.hanging360.com/my-appointment` dentro de un `<iframe>` desde una página local (`dist/index.html`). En iOS WKWebView, y en Android WebView cuando el contenido embebido es de otro origen, el almacenamiento del iframe (cookies, `localStorage`, `IndexedDB`) se trata como *third-party* y se aísla o se borra al cerrar la app. Eso explica exactamente lo que describes:

- El token de Supabase (`persistSession: true` en el portal) vive en el `localStorage` del origen `tech.hanging360.com`. Como es third-party dentro del iframe, iOS lo purga → hay que volver a hacer login.
- Los ajustes por dispositivo del portal (mic on/off, posición de la burbuja Cesar AI, "recordarme") también viven en ese mismo `localStorage` → se resetean con cada arranque.

Ya intentamos habilitar cookies/DomStorage en `MainActivity.java` y añadir `associated-domains` en iOS, pero eso no resuelve el aislamiento third-party del iframe.

**Sonidos**

En `src/config/notificationChannels.ts` los canales `_v4` usan `soundAndroid: "message" | "whatsapp" | "appointment" | "payment"` y `soundIOS: "*.caf"`. En Android, si el recurso `res/raw/<sound>` no está disponible en el momento en que se crea el canal, el canal queda **mudo permanentemente** (Android congela el sonido del canal en la primera creación y no se puede cambiar sin desinstalar). Además el bump a `_v4` inutilizó los `_v3` que sí sonaban con el default. El resultado: notificaciones sin sonido en Android y iOS.

---

## Plan de cambios

### A. Volver ya al sonido por defecto (sin esperar nueva release)

Objetivo: que la app vuelva a sonar con el tono del sistema en las builds ya instaladas y en las nuevas, mientras se preparan los sonidos custom bien empaquetados para la próxima subida a stores.

1. `src/config/notificationChannels.ts`
   - Cambiar `soundAndroid` de todos los canales a `"default"`.
   - Cambiar `soundIOS` de todos los canales a `"default"`.
   - Bump de IDs de `_v4` a `_v5` (Android exige un ID nuevo para que el sonido del canal cambie).
2. `src/services/webBridge.ts`
   - Añadir los IDs `_v4` a la lista `legacyIds` para eliminarlos en la migración.
   - Cambiar la `migrationKey` a `hanging360_notification_channels_v5`.
   - En `createChannel`, pasar `sound: "default"` (no `${name}.mp3`).
   - En `HANGING360_TEST_LOCAL_NOTIFICATION`, dejar `sound: undefined` para que use el default del canal.
3. `src/services/pushNotifications.ts`
   - Actualizar `LEGACY_CHANNEL_ID` a `hanging360_alerts_v5` y forzar `sound: "default"` al programar `LocalNotifications`.
4. `android/app/src/main/java/com/hanging360/app/MainActivity.java`
   - Renombrar `CHANNEL_ID` a `hanging360_alerts_v5` para que coincida con TS.
5. `android/app/src/main/AndroidManifest.xml`
   - Actualizar `com.google.firebase.messaging.default_notification_channel_id` a `hanging360_alerts_v5`.
6. `capacitor.config.ts`
   - Dejar `LocalNotifications.sound: 'default'` (ya está) y quitar cualquier ruta a `.caf`/`.mp3` en `PushNotifications`.

Con esto, en el próximo arranque de la app instalada, los canales viejos se borran y se recrean nuevos con sonido del sistema garantizado en Android e iOS. **No requiere subir nueva versión a stores para las builds futuras**; los usuarios que ya tengan la app instalada recibirán el fix al actualizarla desde la store en el próximo release (Android no permite modificar sonido de un canal ya creado sin cambiar el ID, por eso el bump a `_v5`).

### B. Persistir sesión y ajustes del portal remoto

Causa raíz: el portal se carga en un `<iframe>` de tercer origen dentro del WebView; iOS/Android lo aíslan.

Opción recomendada (mínimo cambio, resuelve las dos quejas):

1. `capacitor.config.ts`
   - Añadir `server.url = "https://tech.hanging360.com/my-appointment"` y `server.allowNavigation = ["tech.hanging360.com"]`.
   - Esto hace que el WebView cargue el portal como *first-party*, no como iframe embebido. Cookies, `localStorage`, IndexedDB y el token de Supabase persisten normalmente entre sesiones. Ajustes de mic, Cesar AI bubble y "recordarme" quedan guardados.
2. `src/components/AppShell.tsx`
   - Simplificar: cuando `isNativePlatform()` sea true, ya no renderiza el `<iframe>` (el WebView carga directamente el portal). Solo mantiene la inicialización de push y el bridge vía `window.postMessage` al `window` actual.
3. `src/services/webBridge.ts` / `pushNotifications.ts`
   - Cambiar `targetWindowRef` para que apunte a `window` (mismo origen ahora) y usar `"*"` u origen `https://tech.hanging360.com` en `postMessage`. El puente sigue funcionando igual desde la web.
4. `ios/App/App/Info.plist` y `android/app/src/main/AndroidManifest.xml`
   - Confirmar que `NSAppTransportSecurity` y el `usesCleartextTraffic=false` permiten HTTPS a `tech.hanging360.com` (ya lo permiten).

Efecto colateral aceptable: al cargar directo se pierde el pequeño overlay/spinner del shell, pero se gana persistencia total y menos latencia.

Alternativa si prefieres mantener el iframe: no hay solución 100% fiable para third-party storage en WKWebView; habría que reescribir el portal para exponer `WKScriptMessageHandler` y guardar la sesión en Keychain nativo. Es un cambio mucho mayor y no lo recomiendo.

---

## Verificación

- **Sonido**: al instalar la nueva build, disparar una push de prueba de cada tipo (`message`, `whatsapp`, `appointment_new`, `appointment_update`, `payment`, `update`) y confirmar que suena el tono del sistema en Android y iOS, foreground y background.
- **Sesión**: iniciar sesión con "recordarme", cerrar la app por completo (swipe), reabrir → debe entrar directo sin pedir login. Mover la burbuja Cesar AI y apagar el micrófono, cerrar y reabrir → deben mantenerse.

---

## Fuera de alcance

- Volver a activar sonidos personalizados: se hará en una release posterior empaquetando correctamente los `res/raw/*.mp3` y los `.caf` en el bundle iOS, verificando con `aapt dump resources` que los archivos existen antes de crear los canales `_v6`.
- Cambios en el portal remoto (`app-hanging360`).
