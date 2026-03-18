

## Plan: Quitar el auto-redirect del último rol

Actualmente, cuando el usuario selecciona un rol (ej: Technician), se guarda en `localStorage` como `lastRole`, y la próxima vez que abre la app, se salta el menú y va directo a ese rol. El usuario quiere que **siempre** se muestre el menú de selección de rol al abrir la app.

### Cambios

**`src/screens/HomeScreen.tsx`**:

1. **Eliminar** el bloque en `useEffect` que lee `lastRole` y hace auto-redirect
2. **Eliminar** la línea `localStorage.setItem("lastRole", path)` en `handleRole`

El `useEffect` queda solo con `SplashScreen.hide()`:

```typescript
useEffect(() => {
  if (!isNative) return;
  SplashScreen.hide().catch(() => {});
}, [isNative]);
```

Y `handleRole` queda sin guardar en localStorage:

```typescript
const handleRole = (path: string) => {
  const url = BASE_URL + path;
  if (isNative) {
    navigate("/v", { state: { url } });
    return;
  }
  window.location.assign(url);
};
```

Así el usuario siempre verá el menú principal al abrir la app.

