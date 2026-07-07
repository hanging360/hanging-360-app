## Plan: Corregir zoom/scroll en Android dentro del WebView

**Problema**: En Android, el iframe carga la página con zoom muy amplio y no permite hacer scroll para llegar al footer (Terms of Service, Privacy Policy, TECH).

**Causa raíz**:
1. El `<meta viewport>` en `index.html` no tiene `viewport-fit=cover` ni control de escalado adecuado para WebView Android.
2. El iframe usa `flex: 1` sin `height: 100%` explícito, y en Android WebView eso a veces se calcula mal con `100dvh`, dejando el iframe más alto que la pantalla y cortando el scroll.
3. Falta `-webkit-overflow-scrolling: touch` y `overflow: auto` en el contenedor.
4. El WebView Android por defecto tiene `useWideViewPort=true` + `loadWithOverviewMode=true` que hace zoom-out en páginas que declaran ancho fijo.

**Cambios**:

1. **`index.html`**: Ajustar meta viewport:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
   ```

2. **`src/index.css`**:
   - `html, body, #root`: usar `height: 100vh` + `overflow: hidden` (el scroll vive dentro del iframe/página remota).
   - `.webview-screen`: `height: 100vh` (no `100dvh`, más consistente en Android WebView) + `width: 100vw` + `overflow: hidden`.
   - `.webview-iframe`: `width: 100%`, `height: 100%`, `display: block`, quitar `flex: 1` para forzar tamaño explícito.

3. **`capacitor.config.ts`**: Añadir configuración Android para que el WebView no aplique overview mode:
   ```ts
   android: {
     allowMixedContent: true,
     webContentsDebuggingEnabled: false,
   }
   ```
   Y a nivel raíz:
   ```ts
   android: { useLegacyBridge: false }
   ```
   (el problema principal es CSS; esto es refuerzo).

**Resultado esperado**: En Android, la página remota se renderiza a ancho real del dispositivo (sin zoom-out), el iframe ocupa exactamente el viewport, y el scroll interno de la página remota funciona correctamente permitiendo llegar al footer.

**Post-cambio**: `npx cap sync android` y reconstruir el APK en Android Studio.
