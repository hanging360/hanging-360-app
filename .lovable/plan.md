## Contexto

La pantalla "Notifications settings" (con "Bell when a message arrives", "Payments", "Open system settings", Play) vive en el **otro proyecto** (`tech.hanging360.com`) que se carga dentro del iframe del WebView. Este proyecto es solo el shell nativo Capacitor. Los botones Play y "Open system settings" no hacen nada porque hoy el iframe no puede pedirle al shell nativo que reproduzca un sonido, abra ajustes del sistema, o cree canales por tipo.

Los sonidos custom "ya están en la app" según indicaste, así que asumo que están empaquetados (o los sirve el web app como assets HTTP). Los reproduciremos con `HTMLAudioElement` dentro del propio iframe (funciona en iOS y Android WebView) y, para push en background, usaremos **canales Android** y **categorías iOS** con el `sound` que ya tenga el sistema o el que mande el backend.

## Qué construir en este proyecto (shell Capacitor)

### 1. Puente `postMessage` bidireccional (nuevo `src/services/webBridge.ts`)

El iframe podrá enviar mensajes tipados y el shell responde. Tipos:

- `HANGING360_PLAY_SOUND` `{ url }` → responde al iframe con `HANGING360_PLAY_SOUND_ACK` (el web app reproduce el audio; el shell solo confirma que estamos en nativo).
- `HANGING360_OPEN_APP_SETTINGS` → abre los ajustes nativos de la app.
- `HANGING360_OPEN_NOTIFICATION_SETTINGS` → abre directamente la pantalla de notificaciones del sistema para la app (Android: `ACTION_APP_NOTIFICATION_SETTINGS`; iOS: `app-settings:`).
- `HANGING360_REGISTER_CHANNELS` `{ channels: [...] }` → crea/actualiza canales Android por tipo (message, payment, appointment, update, whatsapp) con `sound`/`importance`/`vibration` propios.
- `HANGING360_TEST_LOCAL_NOTIFICATION` `{ type }` → dispara un `LocalNotifications.schedule` con ese canal para probar sonido/banner/badge sin depender del backend.
- `HANGING360_SET_BADGE` / `HANGING360_CLEAR_BADGE` (ya existente).
- `HANGING360_REQUEST_PERMISSIONS` → vuelve a pedir permiso de notificaciones si estaba `denied`.
- `HANGING360_PING` → responde `HANGING360_PONG { platform, version, features }` para que el web app detecte que corre en el shell y muestre los botones habilitados.

Plugins nuevos a añadir:
- `@capacitor/app` (ya instalado según docs) para eventos.
- **`@capacitor-community/native-settings`** (nuevo) para abrir ajustes nativos.

### 2. Canales / categorías por tipo de notificación

Definir en un solo lugar (`src/config/notificationChannels.ts`):

```
message         → sonido 'message.caf' / 'message.mp3',  importance HIGH
whatsapp        → sonido 'whatsapp.caf' / 'whatsapp.mp3', importance HIGH
appointment_new → sonido 'appointment.caf' / '.mp3',      importance HIGH
appointment_update → sonido default,                      importance DEFAULT
payment         → sonido 'payment.caf' / '.mp3',          importance HIGH
update          → sonido default,                         importance LOW
```

- **Android**: crear los canales al arrancar la app vía `PushNotifications.createChannel` (uno por tipo). Cada canal aparece en Ajustes → Notificaciones → Hanging360, y el usuario puede cambiarle el tono desde ahí (lo que pide el copy "use your phone settings").
- **iOS**: registrar `UNNotificationCategory` correspondientes en `AppDelegate.swift`. El sonido por categoría se controla desde el `payload` APNs (`"sound": "payment.caf"`); documentar los nombres esperados para el backend.

### 3. Foreground routing por tipo

Actualizar `src/services/pushNotifications.ts` para leer `data.type` (o `data.category`/`data.channel_id`) del payload push y, en Android foreground, hacer `LocalNotifications.schedule` con el canal correcto — así el sonido y el icono coinciden con el tipo. iOS ya lo hace vía categorías + `presentationOptions`.

### 4. Badge

- Al recibir push con `data.badge` o `aps.badge`, llamar a `Badge.set({ count })`.
- Ya se limpia al volver a foreground.
- Añadir listener del mensaje `HANGING360_SET_BADGE` del iframe (ya existe) — verificado.

### 5. Assets de sonido en nativo

Ubicaciones donde deben ir los archivos (indicaremos al usuario dónde subirlos, no los inventamos):
- Android: `android/app/src/main/res/raw/<name>.mp3` (todo en minúscula, sin espacios).
- iOS: agregar `.caf` al target Xcode como "Copy Bundle Resources".

Si los sonidos hoy solo existen como assets web (URL), se pueden reproducir **dentro de la app abierta** vía `<audio>`, pero para **push con app cerrada** el sistema **exige** el archivo empaquetado en el binario. Lo dejo como acción para ti: subir los archivos al repo en las rutas de arriba.

### 6. Guardar credenciales de login

El formulario está en el web app remoto. Aquí solo podemos:
- Asegurar que el `WKWebView` (iOS) y el WebView (Android) tienen habilitado el password manager del sistema.
- iOS: activar `WKWebViewConfiguration.preferences` + `Associated Domains` (requiere entitlement `webcredentials:tech.hanging360.com` y un archivo `apple-app-site-association` publicado por el web app).
- Android: habilitar `WebSettings.setSaveFormData(true)` y confirmar que Autofill Framework está activo (por defecto en API 26+).
- Documentar en `NOTIFICATIONS_SETUP.md` que el **otro proyecto** debe:
  - Usar `<input type="email" autocomplete="username">` y `<input type="password" autocomplete="current-password">`.
  - Servir `/.well-known/apple-app-site-association` con el entitlement `webcredentials`.

Sin cambios en el formulario del otro proyecto, el prompt "Guardar contraseña" no aparecerá. Este plan deja el shell listo; queda coordinar el HTML del web app.

### 7. Página `NOTIFICATIONS_SETUP.md` actualizada

Añadir sección "Mensajes que el web app puede enviar al shell", con los tipos de mensaje del punto 1, el catálogo de canales del punto 2, y los cambios de autofill del punto 6, para que el equipo del otro proyecto lo implemente.

## Archivos a tocar

- `src/services/webBridge.ts` — nuevo, centraliza `postMessage` in/out.
- `src/services/pushNotifications.ts` — routing por tipo + registro de todos los canales.
- `src/config/notificationChannels.ts` — nuevo, catálogo único.
- `src/components/AppShell.tsx` — engancha `webBridge`, quita el listener inline actual.
- `src/lib/capacitorPlugins.ts` — wrappers para `NativeSettings` y `App`.
- `ios/App/App/AppDelegate.swift` — registrar `UNNotificationCategory` por tipo.
- `android/app/src/main/AndroidManifest.xml` — nada nuevo (permisos ya OK).
- `ios/App/CapApp-SPM/Package.swift` — añadir `capacitor-native-settings`.
- `package.json` — añadir `@capacitor-community/native-settings`.
- `NOTIFICATIONS_SETUP.md` — protocolo de mensajes + guía autofill.

## Fuera de alcance (necesita el otro proyecto)

- Los botones Play/Open system en la pantalla Settings del web app: el web app debe enviar los `postMessage` que definimos aquí.
- El HTML del formulario de login (autocomplete hints).
- Publicar `apple-app-site-association` en `tech.hanging360.com`.

Te dejo el shell listo y un README claro para pasarle al otro proyecto.
