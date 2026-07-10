## Qué darle al proyecto web (PWA en tech.hanging360.com)

La app nativa (este proyecto) ya pide permisos, registra el token push y lo envía al iframe por `postMessage`. Lo que falta es que **el proyecto web** lo reciba, lo guarde en Supabase asociado al usuario logueado, y que el backend lo use para mandar notificaciones vía FCM (Android) y APNs (iOS).

## 1. Contrato de mensaje que envía la app nativa

La web debe escuchar `window.addEventListener("message", ...)` con este payload exacto:

```ts
{
  type: "HANGING360_PUSH_TOKEN",
  token: string,           // token FCM (Android) o APNs (iOS)
  platform: "android" | "ios" | "web",
  channelId: "hanging360_alerts_v2"
}
```

Origen del mensaje: la app nativa. La web debe validar que `event.data?.type === "HANGING360_PUSH_TOKEN"` y **no** filtrar por `event.origin` (viene del WebView nativo, no de un dominio http).

## 2. Tabla en Supabase para guardar tokens

En el proyecto web crear una tabla `push_tokens`:

- `id uuid pk`
- `user_id uuid` → `auth.users(id)`
- `token text unique`
- `platform text` (`android` | `ios` | `web`)
- `channel_id text`
- `updated_at timestamptz`

Con RLS: cada usuario solo puede insertar/actualizar/borrar sus propios tokens; `service_role` full access (para que el edge function envíe). GRANTs a `authenticated` y `service_role` según convención del proyecto.

## 3. Hook en la web que escuche y guarde el token

Un `useEffect` global (en el layout raíz o `AuthProvider`) que:

1. Escuche `message` con `type === "HANGING360_PUSH_TOKEN"`.
2. Cuando llegue y haya usuario logueado, haga `upsert` en `push_tokens` por `token`.
3. Si el token llega antes del login, guardarlo en memoria/localStorage y hacer el upsert después del login.

## 4. Edge function para enviar notificaciones

Una función `send-push` en Supabase que:

- Recibe `{ user_id, title, body, data?, badge? }`.
- Lee los tokens de ese usuario desde `push_tokens`.
- Envía a FCM para `platform=android` y a APNs para `platform=ios`.
- Payload debe incluir `android.notification.channel_id = "hanging360_alerts_v2"` y `apns.payload.aps = { alert, sound: "default", badge }` para que suene y aparezca badge/toast fuera de la app.

## 5. Credenciales que el usuario debe entregar al proyecto web

Para que la edge function pueda enviar:

- **Firebase Service Account JSON** (para FCM HTTP v1) — guardado como secret `FCM_SERVICE_ACCOUNT_JSON`.
- **APNs Auth Key `.p8`** + Key ID + Team ID + Bundle ID `com.hanging360.app` — guardados como secrets `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`.
- `APNS_ENVIRONMENT` = `development` para TestFlight/debug, `production` para App Store.

## 6. Puntos donde disparar notificaciones desde la web

Desde el código del proyecto web, llamar a la edge function `send-push` en los eventos donde debe sonar el teléfono: nueva cita asignada, mensaje del staff, alerta de geolocation, etc.

---

### Detalles técnicos

- El canal Android **debe** ser exactamente `hanging360_alerts_v2` en el payload FCM; si no, Android usa un canal por defecto sin sonido.
- APNs necesita `"sound": "default"` en `aps` para que suene; badge requiere número entero en `aps.badge`.
- Para toast/heads-up en Android el payload debe ser `notification` (no solo `data`) y el canal con `IMPORTANCE_HIGH` (ya está así en el nativo).
- La web no necesita implementar Web Push / service worker para esto — el transporte es FCM/APNs a través del token nativo.

### Qué NO se cambia en este proyecto (nativo)

Este plan es solo para el proyecto web. En el nativo ya está: permisos, canal `hanging360_alerts_v2`, entitlement APNs, reenvío de token al iframe. No hay que tocar más aquí.
