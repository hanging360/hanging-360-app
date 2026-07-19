## Problema

El IPA/AAB ya instalado carga `https://tech.hanging360.com/my-appointment` vía `server.url`. La PWA remota ya está actualizada (teclado + sonidos corregidos), pero la app nativa sigue mostrando la versión vieja: no toma los fixes sin reinstalar. No queremos generar un nuevo IPA/AAB.

## Causa

El WebView de Capacitor está sirviendo HTML/JS cacheado. Dos fuentes posibles, y las dos hay que neutralizar desde la **PWA remota** (proyecto Hanging360 Tech 1), porque el shell nativo ya está publicado y congelado:

1. **Service Worker de la PWA** cacheando el app-shell con estrategia cache-first. En cuanto el SW toma control del scope, el WebView recibe siempre el bundle viejo aunque el servidor tenga uno nuevo.
2. **HTTP cache del WebView** (WKWebView en iOS, WebView de Android) sirviendo `index.html` y assets con hash desde disco cuando los headers permiten cache larga.

El shell nativo no puede forzar recarga del contenido remoto sin rebuild, así que la solución vive **100% en la PWA remota**.

## Plan (todo en la PWA remota — sin IPA/AAB nuevo)

1. **Auditar y neutralizar el Service Worker de la PWA**
   - Revisar si existe `sw.js` / `service-worker.js` / `vite-plugin-pwa` registrado en `tech.hanging360.com`.
   - Si existe y está cacheando el app-shell con cache-first: reemplazarlo por un **kill-switch worker** en la misma ruta (según skill PWA de Lovable) que en `activate` borre sus propias cachés Workbox, haga `clients.claim()`, navegue a los clientes abiertos y llame `self.registration.unregister()` en `finally`. Un solo release y el WebView queda limpio.
   - Si el SW debe permanecer para push/offline: cambiar la estrategia de navegación HTML a **NetworkFirst** con timeout corto, dejar `CacheFirst` solo para assets hasheados, y añadir `skipWaiting()` + `clients.claim()` para que la próxima visita entregue la versión nueva sin esperar cierre de app.

2. **Cache-busting de HTML en el servidor de la PWA**
   - Servir `index.html` con `Cache-Control: no-cache, must-revalidate` para que el WebView revalide en cada arranque.
   - Mantener assets con hash (`/assets/*.js`, `*.css`) con `immutable` — el nombre cambia en cada deploy y no requiere invalidación.

3. **Detección de versión desde la PWA**
   - Exponer un `/version.json` (o meta tag) que la PWA lea al montar. Si detecta versión distinta a la cargada en memoria, hace `location.reload()` una vez (guard con `sessionStorage` para no loopear).
   - Esto obliga al WebView a pedir HTML fresco en cada foreground.

4. **Recarga en foreground dentro del WebView**
   - En la PWA, escuchar `visibilitychange`: cuando el documento vuelve a `visible`, disparar el check de versión del paso 3. Cubre el caso "usuario deja la app abierta días" sin depender del shell nativo.

5. **Recuperación única para usuarios ya afectados**
   - El kill-switch del paso 1 los cura al primer arranque con red.
   - Documentar en `NOTIFICATIONS_SETUP.md` que, para usuarios sin red que quedaron con bundle viejo, basta abrir la app con datos una sola vez — no requiere reinstalar.

## Alcance

- **Nada que tocar en este proyecto (shell nativo)**: `capacitor.config.ts`, `MainActivity.java`, `AppDelegate.swift`, `Info.plist` quedan como están. No hay nuevo IPA ni AAB.
- **Todo el trabajo pasa en el proyecto Hanging360 Tech 1** (la PWA `tech.hanging360.com`): auditar SW, publicar kill-switch o cambiar a NetworkFirst, ajustar headers de `index.html`, añadir `version.json` + recarga en foreground.

## Validación

- Publicar el cambio en la PWA.
- Abrir la app nativa ya instalada, con red: al primer arranque debe recargar y mostrar los fixes del teclado (input pegado al teclado, chat con header sticky) y sonidos.
- Segundo arranque: sin recarga visible, versión nueva estable.
- Repetir tras un deploy posterior de la PWA para confirmar que el ciclo se auto-actualiza sin reinstalar.
