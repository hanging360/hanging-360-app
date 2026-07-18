## Contexto

Tienes razón: la app instalada carga `https://tech.hanging360.com/my-appointment` vía `server.url`. Eso significa que **casi todo cambia solo actualizando la PWA** — no hace falta un nuevo IPA/AAB salvo que se modifique algo realmente nativo (permisos nuevos en `Info.plist`/`AndroidManifest`, canales de notificación con sonidos empaquetados, iconos, `capacitor.config.ts`, versiones de plugins, o `server.url`).

El problema actual de sonido/notificaciones/badges viene de mezclar dos capas:

1. **Sonidos in-app (ring, toast, alerta dentro de la app abierta)** → los reproduce la PWA con `HTMLAudioElement`. Si dejó de sonar, es código web, no Capacitor.
2. **Push notifications del sistema (con la app cerrada o en background)** → las entrega FCM/APNs. El sonido lo controla el **canal Android** (fijo al momento de crearse) y el **payload iOS** (`sound: "default"`). El shell nativo solo expone el bridge; el disparador es el backend.

Lo que ha estado rompiendo el sonido son los "bumps" de canal (`_v2 → _v3 → _v4 → _v5`) que hago desde el shell. Cada bump crea un canal nuevo en Android; si el backend sigue enviando al ID viejo o al nuevo sin coincidir, no suena. Y en iOS los `.caf` que agregué al bundle requieren rebuild del IPA.

## Plan (sin tocar nada nativo, sin nuevo IPA/AAB)

### 1. Congelar el shell nativo
- **No más bumps de canal.** Fijar un único ID estable: `hanging360_alerts` (sin sufijo `_vN`) con `sound: "default"` en Android/iOS.
- **No más archivos de sonido empaquetados.** Quitar dependencia de `.caf`/`.mp3` en `res/raw` y en el bundle iOS para que el sonido sea el default del sistema (funciona sin rebuild).
- Dejar de mutar `capacitor.config.ts`, `Info.plist`, `AndroidManifest.xml`, `AppDelegate.swift`, `MainActivity.java`. La versión actual instalada queda como "shell final".

### 2. Mover toda la lógica de notificaciones a la PWA
La PWA (proyecto tech.hanging360.com) ya recibe el token vía `postMessage` del shell. Desde ahí controla todo sin rebuild:

- **Sonido in-app / ring de llamada / toast:** `new Audio('/sounds/xxx.mp3').play()` dentro de la PWA. Se cambia editando la web.
- **Badge:** `postMessage({ type: 'HANGING360_SET_BADGE', count })` al shell (bridge ya existe).
- **Push del sistema:** el backend (edge function de la PWA) envía a FCM/APNs con:
  - Android: `android.notification.channel_id = "hanging360_alerts"`, `sound = "default"`
  - iOS: `aps.sound = "default"`, `aps.badge = N`, `aps.alert = {...}`

### 3. Limpiar el bridge del shell
- `src/services/webBridge.ts`: eliminar migraciones de canales `_v2/_v3/_v4/_v5`. Crear una sola vez el canal `hanging360_alerts` con sonido default.
- `src/config/notificationChannels.ts`: reducir a un canal estable.
- `MainActivity.java`: alinear el ID al mismo `hanging360_alerts`.
- Estos son cambios web (webBridge.ts) + un único cambio Android (constante del channel ID). El Android sí requiere **un último AAB** para dejar el ID estable; después nunca más.

### 4. Documentar para la PWA
Actualizar `NOTIFICATIONS_SETUP.md` con:
- ID de canal único: `hanging360_alerts`
- Payload FCM/APNs de referencia con `sound: "default"`
- Cómo disparar sonido in-app desde la web con `HTMLAudioElement`
- Cómo llamar al bridge para badge/permisos

### 5. Qué SÍ requiere rebuild (para tenerlo claro a futuro)
Solo estos casos justifican nuevo IPA/AAB:
- Cambiar `server.url`, `appId`, permisos nuevos, plugin nuevo, icono/splash, o versión de Capacitor.
- Añadir un sonido custom empaquetado (por eso lo evitamos y usamos `default`).

Todo lo demás — textos, botones, lógica, sonidos in-app reproducidos por `<audio>`, badges, contenido de las notificaciones — se cambia editando la PWA y se ve al abrir la app sin pasar por App Store/Play Store.

## Confirmación antes de implementar

¿Procedo con esto? Implica **un último rebuild AAB (Android)** para fijar el channel ID estable y quitar los `_vN`. iOS no necesita rebuild si el payload usa `sound: "default"` (ya está configurado así). Después de eso, todo el trabajo de notificaciones/sonido se hace en el proyecto de la PWA.
