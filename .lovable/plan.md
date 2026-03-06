

## Plan: Recordar rol seleccionado y persistir sesión

### Problema
1. Cada vez que el usuario abre la app, ve la pantalla de inicio y debe seleccionar su rol de nuevo.
2. Si el técnico hace login, al cerrar y abrir la app pierde la sesión porque el iframe se recarga desde cero.

### Solución

#### 1. Recordar el último rol seleccionado (localStorage)

**`src/screens/HomeScreen.tsx`:**
- Al hacer clic en un botón de rol, guardar la ruta seleccionada en `localStorage` (ej: `localStorage.setItem("lastRole", path)`).

**`src/App.tsx` o `src/screens/HomeScreen.tsx`:**
- Al montar el HomeScreen, verificar si existe `lastRole` en localStorage.
- Si existe, redirigir automáticamente al WebView con esa URL, saltando la pantalla de inicio.

#### 2. Persistir la sesión del login

El iframe carga `tech.hanging360.com/login`. Esa web maneja su propia sesión con cookies. El problema es que al ser cross-origin, las cookies pueden no persistir entre recargas del iframe.

**Enfoque:** No podemos controlar las cookies del sitio externo desde el wrapper. Sin embargo, podemos asegurar que:
- El iframe NO se desmonte innecesariamente (ya está así).
- Al abrir la app de nuevo, si el `lastRole` es `/login` (Technician), cargamos directamente la URL del dashboard post-login en vez de `/login`. Esto depende de si el sitio externo mantiene la sesión via cookies.

**Acción concreta en el wrapper:**
- En `HomeScreen`, al cargar, si `lastRole` existe → navegar directo al WebView.
- Añadir un botón o gesto para "cambiar de rol" / "cerrar sesión" que borre el `lastRole` del localStorage y vuelva al Home.

#### 3. Opción de resetear la selección

- Añadir en el WebView un botón discreto (ej: icono de logout/home) que limpie `localStorage.removeItem("lastRole")` y navegue a `/`.

### Cambios por archivo

**`src/screens/HomeScreen.tsx`:**
- En `useEffect`, leer `localStorage.getItem("lastRole")`. Si existe, hacer `navigate(/webview?url=...)` inmediatamente.
- En `handleRole`, guardar `localStorage.setItem("lastRole", path)` antes de navegar.

**`src/screens/WebViewScreen.tsx`:**
- Añadir un botón flotante discreto (ej: esquina superior derecha, icono de casa) que haga `localStorage.removeItem("lastRole")` y `navigate("/")`. Este botón reemplaza el actual "Back" como mecanismo para volver al inicio.

