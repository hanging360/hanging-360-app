## Problema confirmado

El IPA/AAB abre `https://tech.hanging360.com/my-appointment` directamente mediante `server.url`. Por eso el `AppShell` local, que contiene `initPushNotifications()` y el bridge por iframe, **nunca se ejecuta**. La PWA intenta detectar ese bridge inexistente y muestra “This version doesn't include push”. También hay una incompatibilidad de canales: la PWA envía/crea `h360_default`, mientras el binario declara `hanging360_alerts`.

## Plan de corrección

1. **Usar la arquitectura real: PWA superior + plugins Capacitor directos**
   - En el proyecto **Hanging360 Tech 1**, eliminar la dependencia del handshake por iframe cuando `Capacitor.isNativePlatform()` sea verdadero.
   - Inicializar `PushNotifications` directamente desde la PWA cargada por `server.url`.
   - Mantener el bridge `postMessage` solamente como compatibilidad con shells antiguos que sí usen iframe.

2. **Unificar registro y almacenamiento del dispositivo**
   - Registrar APNs/FCM después del login y también al reabrir la app.
   - Guardar el token directamente en una sola tabla activa y asociarlo al usuario/dispositivo; eliminar la bifurcación inconsistente entre `push_tokens` y `device_tokens` en el flujo principal.
   - Reintentar el registro cuando la app vuelva al foreground o cambie la sesión.
   - Mostrar el estado real del plugin y del permiso, evitando “unsupported” cuando el plugin sí está incluido.

3. **Unificar el sonido de sistema sin depender de archivos personalizados**
   - Usar un único channel ID Android: `hanging360_alerts`, igual al manifiesto y al canal creado por `MainActivity`.
   - Enviar `sound: "default"`, prioridad alta, vibración y badge desde FCM.
   - Enviar `aps.sound: "default"`, alerta y badge desde APNs.
   - Retirar del flujo activo `h360_default` y los canales custom que pueden quedar silenciosos si el recurso no coincide.

4. **Restaurar todos los sonidos dentro de la PWA**
   - Mantener audio web para new email, new message, new appointment, new payment y llamada entrante.
   - Conectar cada evento Realtime/llamada con su tipo de sonido; actualmente no existe una ruta encontrada para sonido de llamada entrante.
   - Desbloquear audio en el primer gesto del usuario y conservar un fallback audible con Web Audio cuando el MP3 falle.
   - Añadir controles independientes en Profile para mensajes/email, citas, pagos, llamadas, silenciar todo y prueba de sonido.

5. **Corregir persistencia de credenciales y ajustes del dispositivo**
   - Hacer que “Recordarme” guarde la sesión en Capacitor Preferences y que las rotaciones del refresh token actualicen ese respaldo.
   - Restaurar sesión antes de concluir que el usuario está desconectado; no limpiar el respaldo por fallos transitorios.
   - Persistir preferencias de sonido, micrófono y configuración del dispositivo por usuario; el permiso real del micrófono siempre se leerá del sistema operativo, no de un booleano local.

6. **Validación completa**
   - Probar desde Profile: permiso push real, micrófono, canal, badge, notificación local y cada sonido.
   - Verificar registro del token y ejecución de la función push con logs reales.
   - Confirmar payload Android/iOS con sonido default y que los eventos foreground generan sonido/toast.
   - Confirmar cierre/reapertura conservando login y preferencias.

## Alcance nativo

La mayor parte se corrige publicando la **PWA**, sin review de stores. Si la versión instalada ya contiene los plugins Capacitor (el código confirma que están en las dependencias), no debería requerir otro IPA/AAB. Solo se considerará rebuild si la prueba en dispositivo demuestra que el plugin no fue realmente sincronizado dentro del binario distribuido.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>