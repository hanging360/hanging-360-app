## Objetivo
Evitar que el WebView instalado siga abriendo un bundle antiguo de `tech.hanging360.com` y conservar login, cookies y preferencias.

## Estado verificado
- Capacitor apunta correctamente a `https://tech.hanging360.com/my-appointment`.
- Esa URL pública responde con `Cache-Control: no-cache, must-revalidate, max-age=0` y actualmente carga `/assets/index-CEyJ1bDU.js`.
- `/sw.js` y `/service-worker.js` ya publican el worker de limpieza.
- `/version.json` todavía responde **404**, por lo que la comprobación automática documentada no está funcionando.
- La URL remota está configurada mediante `server.url`; por eso `AppShell.tsx` y su iframe no controlan la primera carga nativa.

## Implementación
1. **Android:** configurar el WebView nativo con política `LOAD_NO_CACHE`, limpiar únicamente la caché HTTP/WebView al iniciar y recargar la URL remota solicitando revalidación. No borrar cookies, `localStorage`, DOM storage ni credenciales.
2. **iOS:** limpiar `URLCache` al iniciar y configurar las solicitudes remotas para ignorar respuestas cacheadas, sin tocar `WKWebsiteDataStore`, cookies ni sesión.
3. **PWA remota:** dejar como requisito verificable que Hanging360 Tech publique `/version.json` con `Cache-Control: no-store`; al iniciar, volver al foreground y completar login, comparar la versión y hacer una sola recarga cuando cambie.
4. **Evitar ciclos:** proteger la recarga post-login/versionada para que no se repita indefinidamente ni cierre la sesión.
5. **Validación:** confirmar que la app solicita el hash actual del bundle, mantiene el login después de cerrar/reabrir y que un deploy posterior aparece al volver la app al foreground.

## Nota necesaria
La publicación de `/version.json` y la lógica de versión se hace en el proyecto PWA y no necesita nuevas publicaciones en las tiendas. La corrección de la política de caché dentro del WebView —y también cualquier ajuste nativo de teclado/status bar— requiere **un último sync y build de IPA/AAB**; después de instalar esa versión, los siguientes cambios de la PWA se actualizarán remotamente sin reconstruir la app.