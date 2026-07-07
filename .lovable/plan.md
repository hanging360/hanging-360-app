## Plan: Eliminar pantalla de selección, ir directo a Client

La app debe abrir directamente en `https://tech.hanging360.com/my-appointment` sin mostrar el menú con los 4 botones (Client, Promotional, Technician, COMP).

### Cambios

**`src/components/AppShell.tsx`**:
- Establecer `activeUrl` inicialmente en `"https://tech.hanging360.com/my-appointment"` en vez de `null`, para que el iframe se muestre desde el arranque.
- Mantener la inicialización de push notifications.
- Ya no se renderiza `HomeScreen`, así que eliminar su import y el div contenedor.
- En web: hacer `window.location.assign(CLIENT_URL)` de una vez en un `useEffect` para redirigir directo.

**`src/screens/HomeScreen.tsx`**: Se puede dejar el archivo por si en el futuro se quiere restaurar el menú, pero no se importa desde ningún lado.

**`src/App.tsx`**: Sin cambios (sigue montando `AppShell`).

### Comportamiento final

- **App nativa (Capacitor)**: Al abrir, se ve inmediatamente el iframe con la página de client login.
- **Web**: Al entrar al preview/dominio, redirige directo a `tech.hanging360.com/my-appointment` en la misma pestaña.
- El logo, las herramientas, y los 4 botones ya no se ven al abrir la app.

### Nota

Después de aplicar los cambios, para la app nativa necesitas hacer `npx cap sync` y rebuild en Xcode/Android Studio para que se refleje.