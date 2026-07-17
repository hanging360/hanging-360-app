## Objetivo
Evitar que la app pida iniciar sesión en cada apertura y restaurar los sonidos personalizados de mensajes, WhatsApp, citas, pagos y actualizaciones.

## Estado confirmado
- El portal remoto ya configura Supabase con `persistSession: true`, pero su formulario de login no tiene `autocomplete="username"` ni `autocomplete="current-password"`.
- El email solo se guarda después de crear una cuenta, no después de un login exitoso.
- Los cinco sonidos existen en `public/sounds`, Android `res/raw` e iOS, y los `.caf` están incluidos en Copy Bundle Resources.
- Android crea canales con sonidos personalizados, pero reutiliza IDs existentes; Android no permite cambiar el sonido de un canal ya creado, por lo que instalaciones que ya tenían esos canales pueden conservar una configuración anterior silenciosa/default.
- iOS muestra sonido en foreground, pero el sonido personalizado cuando está cerrada depende de que el backend envíe el nombre `.caf` correcto dentro de `aps.sound`.

## Implementación
1. **Persistencia real del login**
   - Corregir el formulario del portal remoto para usar nombres y atributos estándar de Password Manager: `name`, `autocomplete="username"` y `autocomplete="current-password"`.
   - Guardar el email también después de un login exitoso.
   - Validar/restaurar la sesión existente antes de redirigir a `/login`, evitando expulsar al usuario durante la carga o renovación del token.
   - Mantener la contraseña exclusivamente en el gestor seguro de iOS/Android; no guardarla en `localStorage` ni en Preferences.

2. **Restaurar sonidos Android**
   - Versionar los IDs de canales personalizados para obligar a Android a crear canales nuevos con los MP3 actuales.
   - Mantener importancia alta, vibración, badge, lock-screen visibility y el canal correcto por tipo.
   - Ajustar la resolución del payload para aceptar tanto `type` como `channel_id/category` provenientes del backend.
   - Evitar duplicar una notificación foreground si FCM ya la presentó.

3. **Restaurar sonidos iOS**
   - Registrar las categorías/tipos y conservar banner, list, badge y sound en foreground.
   - Mapear cada tipo al `.caf` empaquetado para pruebas locales.
   - Documentar/ajustar el contrato obligatorio del backend: `message.caf`, `whatsapp.caf`, `appointment.caf`, `payment.caf` y `update.caf` en `aps.sound`.

4. **Pruebas funcionales**
   - Verificar login, cierre y reapertura de la app sin volver a pedir credenciales.
   - Probar cada tipo de sonido mediante notificación local.
   - Verificar payloads de foreground, background y app cerrada para Android/iOS, además de badge y banner.

## Entrega nativa
Tras los cambios: `git pull`, `npm install`, `npm run build`, `npx cap sync`, y generar nuevos AAB/IPA en Codemagic; los binarios instalados anteriormente no recibirán estos cambios nativos automáticamente.