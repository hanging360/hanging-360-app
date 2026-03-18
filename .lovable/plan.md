

## Plan: Botones abren internamente en Capacitor, no en browser externo

El problema: en la app nativa, los botones ya navegan a `/v` correctamente. Pero en **web** (preview), `window.open(url, "_blank")` abre una pestaña externa, lo cual no es lo que quieres.

Lo que quieres es que **siempre** naveguen a `/v` internamente (tanto en nativo como en web preview), ya que la app es para Capacitor. La ruta `/v` en web ya tiene la landing page con logo y botones de descarga, así que ese es el comportamiento correcto.

### Cambio

**`src/screens/HomeScreen.tsx`** — línea 69-77: Eliminar la condición `if/else` y hacer que `handleRole` **siempre** navegue a `/v` con state:

```typescript
const handleRole = (path: string) => {
  const url = BASE_URL + path;
  localStorage.setItem("lastRole", path);
  navigate("/v", { state: { url } });
};
```

Esto hace que:
- **Nativo (Capacitor)**: abre el iframe interno como siempre
- **Web**: muestra la landing page con logo + botones de descarga (comportamiento ya implementado en WebViewScreen)

