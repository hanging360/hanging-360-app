## Diagnóstico

**1. Franja blanca entre el teclado y el diálogo (iOS y Android)**
El WebView nativo tiene dos capas apiladas: el shell (`AppShell`) y dentro un `<iframe>` que carga el portal remoto.
- En `src/index.css`, `.webview-iframe` tiene `padding-top/bottom/left/right: env(safe-area-inset-*)` con `background:#ffffff` detrás. Ese padding queda visible como un rectángulo blanco cuando el teclado se abre y el WebView se redimensiona.
- No hay `@capacitor/keyboard` instalado ni configurado, así que iOS/Android no avisan al WebView cómo comprimirse cuando aparece el teclado. Resultado: el iframe conserva alto viejo y el padding-bottom queda visible como "cuadro blanco" empujando el input hacia arriba.

**2. La app dejó de sonar**
- `resolveTypeFromPayload` cae a `"update"` cuando el backend no manda `type/category/channel_id`. El canal `update` usa `update.mp3`, que dura 0.06 s (constatado en el turno anterior) → inaudible en la práctica.
- El canal legacy `hanging360_alerts_v3` se crea con `sound:"default"` pero solo se usa si el push especifica ese `channel_id`; los push genéricos siguen cayendo en `update`.
- En Android, una vez creado un canal con un sonido concreto, ese sonido queda "congelado"; si el MP3 no se empaquetó bien en `res/raw`, el canal queda mudo para siempre. Los archivos existen en `android/app/src/main/res/raw/`, así que el fix es cambiar el sonido por uno audible y forzar la recreación del canal (bump `_v3` → `_v4`).

## Cambios propuestos

### A) Eliminar la franja blanca

1. **`src/index.css`** — en `.webview-iframe`:
   - Quitar los cuatro `padding: env(safe-area-inset-*)` y el `box-sizing`.
   - Mantener el iframe a 100% x 100% sin padding.
   - Mover el color de fondo del safe area a `.webview-screen` (que sí ocupa toda la pantalla incluyendo notch/home indicator), dejándolo `#ffffff` como está — así el notch se ve blanco pero sin bordes que "empujen" el contenido.
   - `.webview-iframe { background: transparent; }` para no pintar sobre el fondo.

2. **`@capacitor/keyboard`** — instalar el plugin y añadirlo a `capacitor.config.ts`:
   ```ts
   Keyboard: {
     resize: 'native',          // iOS: el WebView se ajusta
     resizeOnFullScreen: true,  // Android: respeta immersive
     style: 'light'
   }
   ```
   Esto hace que iOS/Android reduzcan la altura del WebView cuando el teclado sube, y como el iframe ya no tiene padding, no queda ninguna franja blanca entre el input del portal y el teclado.

3. **`AppShell.tsx`** — suscribirse a `Keyboard.addListener('keyboardWillShow'/'keyboardWillHide')` para actualizar `--app-height` restando `event.keyboardHeight` en iOS; en Android el resize nativo ya basta. Esto garantiza que el `visualViewport` recalcula y el iframe no se queda alto.

### B) Restaurar el sonido de las notificaciones

1. **`src/config/notificationChannels.ts`**:
   - Cambiar `LEGACY_CHANNEL_ID` a `hanging360_alerts_v4`.
   - Bump de los 6 canales `_v3` → `_v4` para forzar recreación en dispositivos ya instalados.
   - Canal `update`: cambiar `soundAndroid: "message"` / `soundIOS: "message.caf"` (el `update.mp3` de 0.06 s es inaudible; usamos `message` que sí es audible mientras el usuario no provea otro archivo).
   - Cambiar el fallback de `resolveTypeFromPayload` de `"update"` → `"message"` para que cualquier push sin `type` suene con el canal `message` audible.

2. **`src/services/pushNotifications.ts`** — el canal legacy también debe crearse con `sound:"default"` (ya está) y con importancia 5; verificar que se usa `resolveTypeFromPayload` incluso cuando el push llega en foreground iOS (hoy solo Android agenda `LocalNotifications`; en iOS presentation options ya lo cubre).

3. **`src/services/webBridge.ts`** — la migración `hanging360_notification_channels_v3` pasa a `..._v4`, y la lista `legacyIds` a borrar incluye todos los `_v3` para que Android recree los canales con el nuevo sonido audible.

4. **`capacitor.config.ts`** — `LocalNotifications.sound` se deja en `"default"` (fallback general) y `PushNotifications.presentationOptions` mantiene `['badge','sound','alert']`.

### C) Verificación

- `npm run build && npx cap sync` local.
- Probar en Android: enviar push sin `type` → debe sonar con `message.mp3`.
- Probar en iOS: abrir cualquier input dentro de WhatsApp-like/portal → no debe aparecer franja blanca entre teclado y campo.
- Confirmar en dispositivo que los canales viejos `_v3` desaparecen de Ajustes → Notificaciones y aparecen los `_v4` con el sonido correcto.

## Detalles técnicos

- Los archivos `res/raw/*.mp3` ya están presentes y en minúsculas, cumplen las reglas de Android.
- No se cambia `applicationId`, `versionCode`, ni `codemagic.yaml`.
- No hay cambios en Supabase ni en el portal remoto.
- Para el portal remoto (`tech.hanging360.com`) no se requiere ningún cambio: la corrección del teclado es 100 % en el shell nativo.

## Archivos a modificar

- `src/index.css`
- `capacitor.config.ts`
- `package.json` (añadir `@capacitor/keyboard`)
- `src/components/AppShell.tsx`
- `src/lib/capacitorPlugins.ts` (exportar `Keyboard`)
- `src/config/notificationChannels.ts`
- `src/services/webBridge.ts`
- `src/services/pushNotifications.ts`
