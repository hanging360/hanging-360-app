## Objetivo

Que cada vez que el usuario haga login dentro del Capacitor, el WebView descarte el HTML/JS cacheado y cargue la versión más reciente de `tech.hanging360.com/my-appointment`. Además, dejar un plan de arranque para que la app instalada actual se despegue de la versión vieja sin recompilar (kill‑switch ya publicado) y, si hace falta un último IPA/AAB, tocar solo el shell.

## Cambios en la PWA (proyecto Hanging360 Tech 1) — sin rebuild nativo

1. **Disparar recarga fuerte al completar login**
   - En el handler donde `supabase.auth.signInWithPassword` resuelve OK (o en `onAuthStateChange` cuando `event === 'SIGNED_IN'` y no venga de un refresh silencioso), llamar:
     ```ts
     const url = new URL(window.location.href);
     url.searchParams.set('v', Date.now().toString(36)); // cache-bust
     window.location.replace(url.toString());
     ```
   - Esto obliga al WebView (WKWebView/Chromium Android) a pedir `index.html` de nuevo con `Cache‑Control: no-cache` que ya envía Cloudflare, y a bajar el bundle nuevo (`/assets/index-<hash>.js`).

2. **Kill-switch del Service Worker (ya publicado en `/sw.js`)** — confirmar que sigue activo un release más para limpiar clientes viejos.

3. **`Cache-Control` en Cloudflare** — mantener `no-cache` para `index.html` (ya correcto) y `immutable` para `/assets/*` con hash.

4. **Auto-recarga en foreground** — publicar `/version.json = { "version": "<git-sha>" }`; al montar y en cada `visibilitychange → visible` hacer `fetch('/version.json',{cache:'no-store'})` y `location.replace()` si difiere (guardar sha en `sessionStorage` para evitar loops).

## Cambios en el shell nativo — opcionales, solo si aún falla

Solo si tras (1)–(3) la app instalada sigue mostrando versión vieja, aplicar en el próximo (y último) rebuild:

- **iOS `AppDelegate.swift`** — al `applicationDidBecomeActive`, llamar
  `URLCache.shared.removeAllCachedResponses()` y
  `WKWebsiteDataStore.default().removeData(ofTypes: [WKWebsiteDataTypeDiskCache, WKWebsiteDataTypeMemoryCache], modifiedSince: .distantPast) {}`.
- **Android `MainActivity.java`** — en `onResume()`, `getBridge().getWebView().clearCache(true)` una sola vez al detectar nueva versión (usar `SharedPreferences` para no borrar en cada foreground).
- **Bridge de login → shell** — la PWA hace `window.postMessage({ type: 'HANGING360_FORCE_RELOAD' })`; el shell escucha y llama a los métodos anteriores + recarga la URL.

Ninguno de estos cambios modifica la lógica de negocio ni requiere App Store review nuevo salvo subir versión.

## Qué NO tocamos

`AppShell.tsx` (no se ejecuta cuando `server.url` está activo), canales de notificación, plugins, keystore, permisos, `capacitor.config.ts` — todo queda como está.

## Validación

1. Deploy PWA con el redirect post‑login + `/version.json`.
2. En app ya instalada: hacer logout → login. Debe cargar el bundle nuevo (verificable comparando el hash `/assets/index-<hash>.js` en DevTools remoto).
3. Cerrar y reabrir: la versión persiste; nuevo deploy → al traer al frente, recarga sola.
4. Si un usuario reporta versión vieja tras login: aplicar el rebuild opcional del shell.

## Detalle técnico (referencia)

Estado observado ahora:

- `server.url = https://tech.hanging360.com/my-appointment` (`capacitor.config.ts`).
- Cloudflare ya sirve `index.html` con `cache-control: no-cache, must-revalidate, max-age=0` — el HTML se revalida siempre; los bundles hasheados quedan cacheados por el WebView, y ese es el motivo real de "versión vieja".
- `/sw.js` ya es kill‑switch (verificado: borra caches y `unregister()`).
- Bundle actual servido: `/assets/index-Bz-eZuBZ.js` — sirve de baseline para comparar tras el fix.

El `location.replace('?v=' + timestamp)` fuerza al WebView a resolver una URL nueva; combinado con el `Cache-Control: no-cache` del HTML, el navegador re-descarga el HTML y con él la referencia al bundle hasheado más reciente. No hace falta desregistrar SW en cada login porque ya no hay SW activo tras el kill‑switch.
