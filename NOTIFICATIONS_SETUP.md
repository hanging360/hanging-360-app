# Notificaciones Hanging360 — Canal único estable

La app Capacitor es un shell que carga `https://tech.hanging360.com/my-appointment`.
Toda la lógica de notificaciones vive en la PWA. El shell nativo solo expone:

## ⚠️ Actualización remota del WebView

El shell fuerza revalidación del portal remoto en cada arranque en Android e
iOS, sin borrar cookies, `localStorage`, IndexedDB ni credenciales. Esta
protección nativa requiere un último `npx cap sync` y rebuild de IPA/AAB.
Después de instalar esa versión, los fixes de contenido llegan por deploy de
la **PWA Hanging360 Tech 1** sin nuevos builds de las tiendas.

### 1. Service Worker
Auditar `tech.hanging360.com` en busca de `sw.js` / `service-worker.js` /
`vite-plugin-pwa`. Si el SW cachea el app-shell con estrategia cache-first
publicar en la **misma ruta** el kill-switch worker del skill PWA de
Lovable: en `activate` borra sus cachés Workbox, hace `clients.claim()`,
navega los clientes abiertos y llama `self.registration.unregister()` en
`finally`. Un solo release limpia el WebView.

Si el SW debe permanecer (push, offline): cambiar navegaciones HTML a
**NetworkFirst** con timeout corto, dejar `CacheFirst` solo para assets con
hash, y añadir `self.skipWaiting()` + `clients.claim()`.

### 2. Headers de la PWA
- `index.html` → `Cache-Control: no-cache, must-revalidate`
- `/assets/*.js`, `/assets/*.css` (con hash) → `Cache-Control: public, max-age=31536000, immutable`

### 3. Check de versión en la PWA
Publicar `/version.json` (`{ "version": "<git-sha>" }`). Al montar la app y
en cada `visibilitychange → visible`, hacer fetch con
`cache: 'no-store'`; si difiere de la versión en memoria, un único
`location.reload()` (guardar el sha en `sessionStorage` para evitar loops).

**Estado comprobado el 19 de julio de 2026:** `/version.json` responde 404.
La actualización automática al volver al foreground no queda completa hasta
publicar este archivo con `Cache-Control: no-store` en Hanging360 Tech 1.

### 4. Recuperación de usuarios ya afectados
El kill-switch y los headers actualizan a quienes ya reciben la PWA nueva. Si
el WebView instalado continúa usando recursos antiguos, instalar una vez el
shell con la política nativa de no-cache; no borra la sesión del usuario.

- Un único **channel ID estable**: `hanging360_alerts` (Android)
- Sonido = `default` del sistema (no requiere archivos empaquetados)
- `@capacitor/preferences` para conservar sesión y ajustes del dispositivo
- Bridge `postMessage` para badge y permisos
- El shell no incluye `@capacitor/keyboard`: la PWA administra el viewport
  directamente con `visualViewport` y `100dvh`, sin un segundo resize nativo.

## Teclado en pantallas de chat (PWA)

Sin el plugin Keyboard en el shell, `window.innerHeight`, `100dvh` y
`visualViewport.height` reflejan el área visible de WKWebView. Para que en el chat el
**header de info del cliente** siga visible y **solo suba el composer**, la
PWA debe estructurar la pantalla así:

```css
.chat-screen { display: flex; flex-direction: column; height: 100dvh; }
.chat-header { position: sticky; top: 0; z-index: 10; }
.chat-messages { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.chat-composer { flex: 0 0 auto; padding-bottom: env(safe-area-inset-bottom); }
```

Al enfocar el input, hacer `messagesRef.current?.scrollTo({ top: scrollHeight })`
o `lastMessage.scrollIntoView({ block: "end" })` para mantener el último
mensaje visible.

La PWA se carga como documento principal mediante `server.url`, por lo que
debe usar directamente los plugins Capacitor cuando
`Capacitor.isNativePlatform()` sea `true`. El bridge por `postMessage` queda
solo para compatibilidad con shells antiguos que usaban un iframe.

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

La incorporación de `@capacitor/preferences` requiere un último IPA/AAB. Este
plugin es el respaldo persistente que la PWA ya usa para refresh tokens y
preferencias; sin él, esas llamadas fallan y el usuario vuelve a login.

Todo lo demás (contenido de notificaciones, sonidos in-app, badges, lógica) se
cambia editando la PWA y aparece al reabrir la app sin pasar por App Store/Play.
La política nativa de revalidación agregada en este repositorio sí necesita un
último build; no puede incorporarse a binarios que ya están instalados.

## Forzar recarga del WebView al hacer login (PWA)

El WebView de Capacitor cachea el bundle hasheado (`/assets/index-<hash>.js`).
Cloudflare ya sirve `index.html` con `no-cache`, pero si el usuario no navega
a una URL nueva, el WebView reutiliza el HTML cacheado y sigue apuntando al
bundle viejo. Para que **cada login traiga la última versión**, la PWA debe
forzar una recarga con cache-bust justo después de autenticar.

### 1. Redirect post-login (obligatorio)

En el handler donde `supabase.auth.signInWithPassword` resuelve OK — o dentro
de `onAuthStateChange` cuando `event === 'SIGNED_IN'` y no sea un refresh
silencioso:

```ts
const url = new URL(window.location.href);
url.searchParams.set('v', Date.now().toString(36));
window.location.replace(url.toString());
```

`location.replace` evita entrada en el historial. El query param `?v=...`
obliga al WebView a resolver una URL nueva y a revalidar `index.html`, que
viene con `Cache-Control: no-cache` → se descarga el bundle nuevo.

### 2. Auto-recarga en foreground (recomendado)

Publicar `/version.json` con el SHA del build:

```json
{ "version": "2026-07-19-abc123" }
```

En el cliente:

```ts
async function checkVersion() {
  const res = await fetch('/version.json', { cache: 'no-store' });
  const { version } = await res.json();
  const known = sessionStorage.getItem('h360_version');
  if (known && known !== version) {
    const url = new URL(location.href);
    url.searchParams.set('v', version);
    location.replace(url.toString());
    return;
  }
  sessionStorage.setItem('h360_version', version);
}

checkVersion();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkVersion();
});
```

### 3. Confirmar que el kill-switch de `/sw.js` sigue publicado

Un release más con el service worker que hace `caches.delete(...)` +
`registration.unregister()` para limpiar clientes que aún tengan SW viejo.

### 4. Cache headers en Cloudflare

- `index.html` → `Cache-Control: no-cache, must-revalidate` (ya OK).
- `/assets/*` (hasheados) → `Cache-Control: public, max-age=31536000, immutable`.
- `/version.json` → `Cache-Control: no-store`.

### Validación

1. Anotar hash actual del bundle (`/assets/index-<hash>.js`) desde
   `https://tech.hanging360.com/my-appointment`.
2. Deploy PWA con los cambios de arriba.
3. En la app instalada: logout → login. El nuevo bundle debe cargarse
   (verificable con Safari Web Inspector / `chrome://inspect`).
4. Publicar otro deploy y traer la app al frente: debe recargar sola.

No requiere rebuild del IPA/AAB.
