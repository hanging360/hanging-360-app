

## Plan: Navegación directa en web, /v solo para nativo

**`src/screens/HomeScreen.tsx`** — modificar `handleRole`:
- Si `Capacitor.isNativePlatform()`: navegar a `/v` con state (comportamiento actual)
- Si NO es nativo (web browser): abrir `BASE_URL + path` directamente con `window.open(url, "_blank")` o `window.location.href`

No se necesitan cambios en otros archivos.

