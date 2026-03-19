

## Plan: Corregir persistencia de login y agregar push notifications

### Problema 1: Login se pierde al volver al menu

**Causa raiz**: Cuando el usuario toca "Volver" o regresa al menu, la app navega de `/v` a `/`. Esto **destruye el iframe** completamente. Al volver a seleccionar un rol, se crea un iframe nuevo que no tiene las cookies de sesion del anterior -- el sitio pide login de nuevo.

**Solucion**: Cambiar la arquitectura para que el iframe no se destruya. En vez de usar rutas separadas (`/` y `/v`), mantener ambas vistas en un solo componente con un estado que controle cual se muestra. El iframe se oculta con CSS (`display: none`) en vez de desmontarse, preservando las cookies y la sesion.

**Cambios**:

- **`src/App.tsx`**: Reemplazar las rutas separadas por un solo componente `AppShell` que maneja el estado de navegacion internamente
- **`src/components/AppShell.tsx`** (nuevo): Componente que renderiza HomeScreen y el iframe siempre. Usa estado `activeUrl` para decidir que mostrar. Cuando `activeUrl` es null, muestra HomeScreen. Cuando tiene valor, oculta HomeScreen y muestra el iframe. El iframe se mantiene montado con `display: none` cuando no esta activo
- **`src/screens/HomeScreen.tsx`**: Recibe un callback `onSelectRole(url)` en vez de usar `navigate`
- **Eliminar `src/screens/WebViewScreen.tsx`**: Ya no se necesita como pantalla separada; su logica del iframe se mueve a AppShell

```text
Antes:                          Despues:
HomeScreen ──navigate──> /v     AppShell
     (destruye Home)              ├─ HomeScreen (visible/oculto)
WebViewScreen (iframe nuevo)      └─ iframe (siempre montado, visible/oculto)
     ──navigate──> /                   cookies preservadas
     (destruye iframe + cookies)
```

---

### Problema 2: Push notifications no funcionan

**Causa**: No hay ninguna implementacion de push notifications. No existe `@capacitor/push-notifications` ni codigo de registro FCM.

**Cambios**:

- **`package.json`**: Instalar `@capacitor/push-notifications`
- **`src/services/pushNotifications.ts`** (nuevo): Servicio que:
  - Solicita permisos al usuario
  - Registra el dispositivo para recibir notificaciones
  - Obtiene el token FCM/APNs
  - Escucha eventos de notificacion recibida (foreground y background)
  - Maneja badges y sonidos
- **`capacitor.config.ts`**: Agregar configuracion del plugin PushNotifications con `presentationOptions: ["badge", "sound", "alert"]` para que iOS muestre badges, sonidos y alertas cuando la app esta en background
- **`src/components/AppShell.tsx`**: Inicializar el servicio de push notifications al montar la app en plataforma nativa

### Nota importante

Despues de estos cambios necesitas:
1. `npx cap sync` para sincronizar los plugins nativos
2. En **iOS (Xcode)**: Activar la capability "Push Notifications" en el target del proyecto
3. Configurar **Firebase Cloud Messaging** o **APNs** en el backend de `tech.hanging360.com` para enviar las notificaciones al token del dispositivo
4. Rebuild en Xcode / Android Studio

### Seccion tecnica

**Persistencia de cookies en iframe iOS**: WKWebView en Capacitor comparte el proceso de cookies dentro de la misma instancia. Si el iframe se mantiene montado, las cookies persisten. Al destruirlo y crear uno nuevo, se pierden en muchos casos por las politicas de ITP (Intelligent Tracking Prevention) de Safari/WebKit.

**PushNotifications presentationOptions**: La config `["badge", "sound", "alert"]` le dice a iOS que muestre notificaciones completas (con sonido, badge en el icono, y banner) cuando la app esta en foreground. Para background, iOS las maneja automaticamente si el servidor envia el payload correcto con `aps.badge`, `aps.sound`, y `aps.alert`.

