## Problema real
La app nativa tiene partes incompletas para notificaciones/permisos:

- Android solo tiene permiso de notificaciones, pero faltan permisos de ubicación y micrófono.
- iOS no tiene textos de autorización para micrófono/ubicación ni configuración completa para push.
- El canal Android actual puede haberse creado sin sonido en teléfonos ya instalados; Android no cambia el sonido de un canal existente.
- En iOS falta el reenvío del token APNs desde `AppDelegate` al plugin de Capacitor Push Notifications.
- El token push solo se imprime en consola; no se entrega todavía a la web/servidor, así que el backend no sabe a qué teléfono enviar mensajes.
- `capacitor.config.ts` no incluye `presentationOptions: ["badge", "sound", "alert"]`, que ya estaba definido como requisito del proyecto.

## Plan de implementación

1. **Configurar Capacitor para alertas, sonido y badge**
   - Actualizar `capacitor.config.ts` con:
     - `plugins.PushNotifications.presentationOptions = ["badge", "sound", "alert"]`
     - `allowNavigation: ["tech.hanging360.com"]` para mantener autorizado el WebView remoto.

2. **Corregir Android: permisos + canal con sonido**
   - En `AndroidManifest.xml`, agregar permisos para:
     - `ACCESS_FINE_LOCATION`
     - `ACCESS_COARSE_LOCATION`
     - `RECORD_AUDIO`
     - `MODIFY_AUDIO_SETTINGS`
   - Cambiar el notification channel a un ID nuevo, por ejemplo `hanging360_alerts_v2`, porque Android no permite arreglar sonido/importancia de un canal ya creado en instalaciones existentes.
   - Actualizar el `meta-data` del canal default Firebase para usar ese nuevo ID.
   - Mantener `IMPORTANCE_HIGH`, vibración, luces y sonido default.

3. **Corregir iOS: permisos y push nativo**
   - En `Info.plist`, agregar textos obligatorios de autorización:
     - `NSLocationWhenInUseUsageDescription`
     - `NSMicrophoneUsageDescription`
     - `NSCameraUsageDescription` si la web puede usar cámara junto con micrófono.
   - Agregar `UIBackgroundModes` con `remote-notification` para mejor manejo de notificaciones remotas.
   - Actualizar `AppDelegate.swift` para reenviar a Capacitor:
     - `didRegisterForRemoteNotificationsWithDeviceToken`
     - `didFailToRegisterForRemoteNotificationsWithError`

4. **Agregar entitlement de Apple Push Notifications**
   - Crear `ios/App/App/App.entitlements` con `aps-environment`.
   - Conectar ese archivo al target iOS en `project.pbxproj` usando `CODE_SIGN_ENTITLEMENTS`.
   - Usar `development` para debug y `production` para release.

5. **Mejorar el registro del token push**
   - Extender el wrapper para que cuando reciba el token de push:
     - lo guarde localmente,
     - lo mande por `postMessage` al iframe `https://tech.hanging360.com`, para que la web pueda registrarlo con usuario/rol si tiene listener,
     - y deje listo el punto exacto donde conectar `/push/register` si existe en el backend.
   - Mantener logs mínimos para diagnóstico sin exponer secretos.

6. **Actualizar tipos del plugin**
   - Agregar `createChannel` al wrapper TypeScript de `PushNotifications`, para que Android cree el canal de alta prioridad desde JS también.
   - Usar el mismo canal nuevo `hanging360_alerts_v2` en JS y Android nativo.

7. **Documentar pasos obligatorios después del cambio**
   - El usuario deberá hacer `git pull`.
   - Ejecutar `npx cap sync android` y `npx cap sync ios`.
   - Reinstalar la app en Android o borrar el canal viejo desde ajustes del teléfono; con canal nuevo debería aplicar sonido automáticamente.
   - En Apple Developer/Codemagic, confirmar que el App ID `com.hanging360.app` tiene Push Notifications habilitado y provisioning profile regenerado.

## Resultado esperado
Android/iPhone pedirán permisos correctos, las notificaciones podrán aparecer como alerta/banner/toast nativo, con sonido y badge cuando el payload del servidor incluya badge/count. La app quedará preparada para registrar el token del teléfono y que el backend pueda enviar mensajes reales.