## Plan: Modo inmersivo Android + scroll completo hasta el footer

**Problemas reportados**:
1. Al abrir la app en Android, la barra de navegación nativa (botones back/home/recent) sigue visible y roba espacio de pantalla.
2. Dentro del WebView, no se puede hacer scroll hasta el final de la página remota — el footer (Terms, Privacy, TECH) queda inalcanzable.

**Causa**:
- No hay plugin/config que active el modo *edge-to-edge* / *immersive* en Android, así que la system nav bar sigue empujando el layout.
- El contenedor `.webview-screen` está fijado a `var(--app-height)` con `overflow: hidden`, y el iframe hereda ese alto. Cuando la barra de navegación de Android se resta del `visualViewport`, el iframe queda más corto que su contenido pero sin permitir scroll interno del iframe (el scroll debe ocurrir *dentro* del documento remoto, no en el iframe). El `touch-action` y el `overscroll-behavior: none` del contenedor están bloqueando parte del gesto de scroll vertical hacia el footer.

**Cambios**:

1. **Modo inmersivo Android (ocultar nav bar nativa)**  
   Instalar `@capacitor/status-bar` y usar `StatusBar.hide()` + `setOverlaysWebView({ overlay: true })` al inicializar. Para ocultar también la *navigation bar* inferior, agregar el plugin comunitario `@capacitor-community/immersive-mode` (o usar `EdgeToEdge` de Capacitor 7). Alternativa sin plugin: añadir en `capacitor.config.ts`:
   ```ts
   android: {
     allowMixedContent: true,
     backgroundColor: "#ffffff",
   }
   ```
   y crear un pequeño estilo Android en `android/app/src/main/res/values/styles.xml` con `windowTranslucentNavigation` + flag `SYSTEM_UI_FLAG_IMMERSIVE_STICKY` (se documenta como paso manual post-`cap sync`).  
   Recomendado: usar el plugin `@capacitor-community/immersive-mode` desde JS, así queda todo controlado desde `AppShell.tsx`.

2. **Scroll completo hasta el footer en el iframe**  
   En `src/index.css`:
   - `.webview-screen`: quitar `touch-action: pan-x pan-y` (dejar `touch-action: auto`) y quitar `overscroll-behavior: none` para no cortar el gesto.
   - `.webview-iframe`: quitar `overflow: auto` (un iframe no scrollea así en Android; el scroll ocurre dentro del documento remoto). Dejar solo `width: 100%; height: 100%; display: block; border: 0`.
   - Ajustar `--app-height` para que use `window.innerHeight` (que ya excluye la nav bar) en lugar de `visualViewport.height` (que cambia al aparecer el teclado y puede dejar el iframe corto).

3. **Ajuste en `AppShell.tsx`**  
   - Añadir en el `useEffect` nativo: `StatusBar.hide()` y llamada al plugin de immersive mode.  
   - Simplificar `syncViewportSize` para usar `window.innerHeight` como base y sólo usar `visualViewport` como fallback.  
   - Añadir `scrolling="yes"` ya está; asegurar que el iframe no tenga `overflow: auto` (ver punto 2).

**Resultado esperado**:  
La barra de navegación nativa de Android se oculta (modo inmersivo sticky), el WebView ocupa toda la pantalla, y el usuario puede hacer scroll dentro de la página remota hasta ver y pulsar los botones del footer.

**Post-cambio**:  
`npm i @capacitor/status-bar @capacitor-community/immersive-mode` → `npx cap sync android` → rebuild APK en Android Studio.

### ¿Confirmas?
- ¿Ocultar **también** la barra de navegación inferior (immersive sticky) o sólo la status bar superior?
- ¿OK con añadir el plugin `@capacitor-community/immersive-mode`?
