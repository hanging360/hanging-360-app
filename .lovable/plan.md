## Plan: Eliminar pantalla negra al abrir la app

**Problema**: Al abrir la app nativa, se ve una pantalla negra durante varios segundos antes de que cargue `tech.hanging360.com/my-appointment`. Esto ocurre porque:

1. El SplashScreen de Capacitor está configurado con `launchAutoHide: false`, pero nadie lo oculta manualmente ahora (el código que llamaba `SplashScreen.hide()` estaba en `HomeScreen.tsx`, que ya no se usa).
2. Mientras el iframe carga la URL remota, el fondo del WebView y del contenedor es transparente/negro, sin indicador visual.

### Cambios

**`capacitor.config.ts`**:
- Cambiar `SplashScreen.launchAutoHide` a `true` para que iOS/Android oculten el splash nativo automáticamente al terminar de arrancar la WebView.
- Añadir `backgroundColor: "#ffffff"` (ya existe) y agregar `ios: { backgroundColor: "#ffffff" }` y `android: { backgroundColor: "#ffffff" }` en la raíz para que el WebView no muestre negro.
- Aumentar `SplashScreen.launchShowDuration` a ~2000ms para cubrir el arranque inicial mientras el iframe carga.

**`src/components/AppShell.tsx`**:
- Volver a importar `@capacitor/splash-screen` y llamar `SplashScreen.hide()` cuando el iframe dispare `onLoad` (así el splash permanece visible hasta que la página real está lista, evitando la pantalla negra intermedia).
- Añadir un fondo blanco al contenedor `.webview-screen` y un overlay de loading (spinner o logo) mostrado hasta que `onLoad` se dispare por primera vez, para que si el splash se oculta antes también haya feedback visual en vez de negro.
- Estado `isLoaded` que se pone a `true` en el primer `onLoad`; mientras sea `false`, mostrar overlay con logo/spinner sobre fondo blanco.

**`src/index.css`**:
- Asegurar que `html`, `body`, `#root` y `.webview-screen` tengan `background: #ffffff` (o el color del branding) para eliminar cualquier flash negro.

### Resultado

Al abrir la app: splash nativo visible → transición directa a fondo blanco con logo/spinner → iframe carga y aparece la página. Sin pantalla negra intermedia.

### Nota

Requiere `npx cap sync` y rebuild en Xcode/Android Studio para aplicar los cambios de `capacitor.config.ts`.
