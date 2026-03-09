

## Plan: Asegurar la app contra inspección y copia

### Problema
La URL interna (`/webview?url=...`) es visible en el navegador, las rutas internas son predecibles, y no hay protección contra herramientas de desarrollo ni copia del código fuente.

### Medidas de seguridad a implementar

#### 1. Ocultar la URL del WebView de la barra de navegación
- Cambiar de query params (`/webview?url=...`) a estado interno usando `useNavigate` con `state`.
- La ruta será solo `/webview` sin parámetros visibles.
- Si alguien accede a `/webview` directamente sin state, redirigir al home.

#### 2. Bloquear herramientas de desarrollo y clic derecho
Añadir un script de seguridad en `index.html` que:
- Deshabilite clic derecho (`contextmenu`)
- Bloquee atajos de DevTools: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (ver código fuente)
- Deshabilite selección de texto y arrastre de elementos

#### 3. Ofuscar rutas internas
- Renombrar la ruta `/webview` a algo no descriptivo como `/v`.
- Eliminar el parámetro `url` visible.

#### 4. Bloquear acceso desde navegador web (solo nativo)
- En `WebViewScreen`, verificar `Capacitor.isNativePlatform()`. Si NO es nativo, mostrar un mensaje genérico ("Descarga la app") en vez del contenido.

#### 5. Desactivar source maps en producción
- En `vite.config.ts`, configurar `build.sourcemap: false` (ya es el default, pero hacerlo explícito).

### Cambios por archivo

| Archivo | Cambio |
|---------|--------|
| `index.html` | Añadir script anti-devtools, anti-clic-derecho, anti-selección |
| `src/index.css` | Añadir `user-select: none` global |
| `src/screens/HomeScreen.tsx` | Navegar con `state` en vez de query params |
| `src/screens/WebViewScreen.tsx` | Leer URL de `location.state`, verificar plataforma nativa, redirigir si acceso directo |
| `src/App.tsx` | Cambiar ruta `/webview` → `/v` |
| `vite.config.ts` | `build: { sourcemap: false }` explícito |

### Limitaciones importantes
- Estas medidas dificultan la copia casual pero **no son infalibles** contra un atacante determinado — el código JavaScript del cliente siempre es accesible en última instancia.
- La seguridad real del login y datos depende del servidor (`tech.hanging360.com`), no del wrapper.

