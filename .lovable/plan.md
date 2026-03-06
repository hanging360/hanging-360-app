

## Plan: Restaurar el Wrapper Capacitor para Hanging 360

### Contexto

Este proyecto es un **wrapper nativo con Capacitor** que carga `https://tech.hanging360.com` en un WebView. El código original se perdió por un error en GitHub. Según las memorias del proyecto:

- La app muestra pantallas nativas (Splash, selección de rol) antes de navegar al WebView
- El WebView está limitado a `tech.hanging360.com/*`; URLs externas abren en el navegador del sistema
- Hay 3 flujos: Client → `/my-appointment`, Technician → `/login`, Promotional → `/promotional`
- Capacitor usa autenticación nativa solo para clientes; técnicos y admin van directo al login web
- La carpeta Android NO se incluye en el repo (compilación manual)

### Lo que hay que construir

#### 1. Instalar Capacitor y dependencias
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`
- `@capacitor/splash-screen` (para pantalla de carga)
- `@capacitor/browser` (para abrir URLs externas)

#### 2. Configurar Capacitor
- Crear `capacitor.config.ts` con:
  - `appId: "app.lovable.5b3efdff0bb64b46b9a09667099613c7"`
  - `appName: "wrap-access-now"`
  - `server.url` apuntando al sandbox de Lovable para desarrollo
  - `server.cleartext: true`

#### 3. Crear pantallas del wrapper

- **SplashScreen**: Pantalla de carga con logo/branding de Hanging 360
- **HomeScreen (RoleSelect)**: Pantalla con 3 botones de rol:
  - **Client** → WebView a `https://tech.hanging360.com/my-appointment`
  - **Technician** → WebView a `https://tech.hanging360.com/login`
  - **Promotional** → WebView a `https://tech.hanging360.com/promotional`
- **WebViewScreen**: Componente que carga `tech.hanging360.com` en un iframe (preview) o WebView nativo (Capacitor), con restricción de navegación al dominio permitido

#### 4. Configurar rutas
```text
/           → HomeScreen (selección de rol)
/webview    → WebViewScreen (recibe URL destino por query param)
*           → NotFoundScreen
```

#### 5. Lógica de navegación del WebView
- Interceptar navegación: solo permitir URLs de `tech.hanging360.com/*`
- URLs externas → abrir con `@capacitor/browser`
- Botón de retroceso para volver a la selección de rol

### Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `package.json` | Agregar dependencias Capacitor |
| `capacitor.config.ts` | Crear configuración Capacitor |
| `src/screens/HomeScreen.tsx` | Reescribir como selector de rol con 3 botones |
| `src/screens/WebViewScreen.tsx` | Crear con iframe/WebView para tech.hanging360.com |
| `src/App.tsx` | Agregar ruta `/webview` |
| `src/index.css` | Estilos mobile-first para las pantallas |

