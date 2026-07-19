# Por qué la app nativa sigue con la versión vieja

El shell Capacitor apunta a `https://tech.hanging360.com/my-appointment` vía `server.url`. Ese shell ya está publicado y **no se toca** (no hay IPA/AAB nuevo). Si al abrirlo se ve la versión vieja aunque la PWA ya esté deployada con los fixes de teclado/sonido, la causa es una sola: el WebView está sirviendo HTML/JS cacheado. Dos fuentes posibles y las dos se arreglan **en el proyecto Hanging360 Tech 1 (la PWA)**:

1. Un Service Worker registrado en `tech.hanging360.com` con estrategia cache-first para el app-shell — sigue entregando el bundle viejo aunque el server tenga uno nuevo.
2. HTTP cache del WebView (WKWebView iOS / WebView Android) sirviendo `index.html` desde disco por headers de cache largos.

El shell nativo no puede forzar recarga del contenido remoto sin rebuild. La solución vive 100% en la PWA remota.

## Qué hacer en la PWA remota (proyecto Hanging360 Tech 1)

### 1. Auditar y neutralizar el Service Worker
- Buscar `sw.js`, `service-worker.js`, `vite-plugin-pwa`, `virtual:pwa-register` o `workbox-*` en el repo de la PWA.
- Si existe y cachea el app-shell con cache-first: publicar **en la misma ruta** el kill-switch worker del skill PWA de Lovable — en `activate` borra sus propias cachés Workbox, hace `clients.claim()`, navega los clientes abiertos y llama `self.registration.unregister()` en `finally`. Un solo release limpia el WebView.
- Si el SW debe permanecer (push background, offline): navegaciones HTML a **NetworkFirst** con timeout corto, `CacheFirst` solo para `/assets/*` con hash, `skipWaiting()` + `clients.claim()`.

### 2. Headers de cache del hosting
- `index.html` → `Cache-Control: no-cache, must-revalidate`
- `/assets/*.js`, `/assets/*.css` (con hash) → `Cache-Control: public, max-age=31536000, immutable`

### 3. Check de versión + recarga en foreground
- Publicar `/version.json` = `{ "version": "<git-sha>" }`.
- Al montar la app y en cada `document.visibilitychange → visible`, `fetch('/version.json', { cache: 'no-store' })`. Si difiere de la versión en memoria, un único `location.reload()` (guardar en `sessionStorage` para evitar loops).
- Esto cubre el caso "el usuario dejó la app abierta" — la próxima vez que la trae al frente, recarga sola.

### 4. Layout de teclado en la PWA (confirmar que quedó bien)
Con `Keyboard.resize: 'native'` del shell, `100dvh` y `visualViewport.height` ya reflejan el alto visible por encima del teclado. La pantalla de chat debe estructurarse así en la PWA para que **el header "Info cliente" quede sticky** y **solo suba el composer** (no toda la página, que es lo que se ve en IMG_4328/4329/4330):

```css
.chat-screen   { display:flex; flex-direction:column; height:100dvh; }
.chat-header   { position:sticky; top:0; z-index:10; }
.chat-messages { flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; }
.chat-composer { flex:0 0 auto; padding-bottom:calc(env(safe-area-inset-bottom) + var(--kb-h, 0px)); }
```

Al hacer focus en el input: `lastMessage.scrollIntoView({ block: 'end' })`.

Si tras el kill-switch la app nativa sigue mostrando la franja blanca bajo el input, el problema ya no es el cache — es que la PWA todavía usa `min-height: 100vh` o mide `window.innerHeight` una sola vez. Revisar y cambiar a `100dvh` + escuchar `visualViewport.resize`.

## Qué NO se toca aquí

`capacitor.config.ts`, `MainActivity.java`, `AppDelegate.swift`, `Info.plist`, plugins, canales de notificación, `AppShell.tsx` — todo el shell nativo queda como está. **No hay IPA nuevo, no hay AAB nuevo.**

## Validación

1. Deploy de la PWA con kill-switch + headers + `version.json`.
2. Abrir la app nativa ya instalada con red: primer arranque recarga sola y muestra los fixes de teclado y sonido.
3. Segundo arranque: sin recarga visible, versión estable.
4. Nuevo deploy de la PWA después: la app se actualiza sola al volver a foreground, sin reinstalar.

## Detalle técnico (referencia)

El kill-switch worker (`public/sw.js` en la PWA):

```js
function isWorkboxCacheForThisRegistration(name) {
  return /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name)
    && name.endsWith(self.registration.scope);
}
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil((async () => {
  try {
    const names = (await caches.keys()).filter(isWorkboxCacheForThisRegistration);
    await Promise.allSettled(names.map((n) => caches.delete(n)));
    await self.clients.claim();
    const wins = await self.clients.matchAll({ type: "window" });
    await Promise.allSettled(wins.map((c) => c.navigate(c.url)));
  } finally {
    await self.registration.unregister();
  }
})()));
```

Este proyecto (shell nativo) solo actualizará `.lovable/plan.md` y `NOTIFICATIONS_SETUP.md` para dejar la instrucción por escrito al equipo de la PWA. Cero cambios de código nativo, cero rebuild.
