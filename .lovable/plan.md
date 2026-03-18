

## Plan: Corregir error -999 al cargar la app en Capacitor

### Problema

El error `NSURLErrorDomain -999` ocurre **antes** de que la app cargue — cuando el WKWebView de Capacitor intenta cargar la URL del servidor (`lovableproject.com`). Este error en iOS significa "request cancelled", y pasa porque:

1. El WKWebView empieza a cargar `lovableproject.com`
2. Antes de terminar, el `useEffect` en HomeScreen detecta `lastRole` y navega inmediatamente a `/v`
3. `/v` carga un iframe hacia `tech.hanging360.com`
4. iOS cancela la primera carga → error -999

### Cambios

**1. `capacitor.config.ts`** — Agregar `allowNavigation` para permitir explícitamente el dominio de destino en el WKWebView de iOS:

```typescript
server: {
  url: "...",
  cleartext: true,
  allowNavigation: ["tech.hanging360.com"],
},
```

**2. `src/screens/HomeScreen.tsx`** — Agregar un delay de 500ms antes del auto-redirect para dejar que el WKWebView termine de cargar la página inicial:

```typescript
useEffect(() => {
  if (!isNative) return;
  SplashScreen.hide().catch(() => {});
  const lastRole = localStorage.getItem("lastRole");
  if (lastRole) {
    setTimeout(() => {
      navigate("/v", { replace: true, state: { url: BASE_URL + lastRole } });
    }, 500);
  }
}, [navigate, isNative]);
```

**3. `src/screens/WebViewScreen.tsx`** — Agregar retry automático en el iframe por si falla la primera carga:

- Estado `iframeKey` para forzar reload
- `onError` handler que incrementa la key después de 1 segundo
- Máximo 3 reintentos para no hacer loop infinito

### Después de los cambios

Necesitas hacer `npx cap sync` y recompilar en Xcode para que los cambios de `capacitor.config.ts` apliquen.

