## Problema

Solo dentro del Capacitor instalado (no en PWA ni web) al abrir el teclado:
1. La página entera se empuja hacia arriba dejando un cuadro blanco debajo del input.
2. En las pantallas de chat, la conversación se mete **debajo del header de info del cliente** y los mensajes anteriores dejan de ser legibles mientras escribes — se debería mover **solo el input del chat**, no toda la página.

## Causa

`capacitor.config.ts` carga la PWA remota vía `server.url`. El plugin `@capacitor/keyboard` está en `resize: 'body'`, que reduce el `<body>` cuando aparece el teclado. Efectos:
- El fondo del WebView queda visible como franja blanca bajo el body más corto.
- En vistas de chat el layout no está anclado al `visualViewport`; el scroll interno arrastra la lista de mensajes bajo el header fijo (que no se recoloca) y solo se ve el último mensaje sobre el teclado.

En Android además `android:windowSoftInputMode="adjustResize"` combinado con `resize: 'body'` provoca doble redimensionado.

## Plan

1. **Cambiar el modo de teclado del Capacitor a `native`**
   - En `capacitor.config.ts` reemplazar `Keyboard.resize: 'body'` por `resize: 'native'` (el sistema redimensiona la WebView completa; sin franja blanca y sin tocar el DOM).
   - Mantener `resizeOnFullScreen: true` y `style: 'light'`.

2. **Alinear Android**
   - En `AndroidManifest.xml` mantener `android:windowSoftInputMode="adjustResize"` (compatible con `resize: 'native'`).
   - Confirmar que `MainActivity` no fija `SOFT_INPUT_ADJUST_NOTHING` en modo inmersivo.

3. **Alinear iOS**
   - En `Info.plist` añadir `KeyboardResize` = `native` y `KeyboardResizeOnFullScreen` = `YES` (algunas versiones del plugin leen del plist además del config).

4. **Corregir el chat: solo sube el input, no la página**
   - Escuchar `Keyboard.addListener('keyboardWillShow' / 'keyboardWillHide')` desde el shell nativo y publicar la altura del teclado a la PWA por `postMessage` como `HANGING360_KEYBOARD_HEIGHT`.
   - Exponer en la PWA una CSS var `--kb-h` alimentada por ese evento (ya sea vía el bridge del shell o directamente con `window.visualViewport` cuando la PWA se ejecuta dentro del Capacitor).
   - En las pantallas de chat de la PWA (proyecto **Hanging360 Tech 1**): anclar el contenedor del chat con `height: calc(100dvh - var(--kb-h, 0px))`, mantener el header de info del cliente `position: sticky; top: 0`, la lista de mensajes con `flex: 1; overflow-y: auto; overscroll-behavior: contain`, y el composer con `padding-bottom: var(--kb-h, 0px)`. Al abrir el teclado, hacer `scrollIntoView({ block: 'end' })` sobre el último mensaje.
   - Documentar el contrato del mensaje `HANGING360_KEYBOARD_HEIGHT` en `NOTIFICATIONS_SETUP.md` para el equipo de la PWA.

5. **Limpieza CSS local**
   - La variable `--app-height` solo la usa `.webview-screen` del `AppShell` interno (inactivo cuando `server.url` está fijado). Se mantiene sin cambios.

## Alcance nativo vs PWA

- Puntos 1–3 y el emisor del evento del punto 4 requieren **un rebuild IPA/AAB**.
- El consumidor del evento (layout del chat con `--kb-h`, header sticky, composer anclado) se aplica en la **PWA remota** y sale al aire con un simple deploy, sin nueva app.

## Validación

- App instalada: tocar cualquier input común (login, dialog) → el input queda justo sobre el teclado, sin franja blanca.
- Chat: al enfocar el composer, el header del cliente permanece visible, la lista de mensajes se acorta y sigue scrolleable, y el último mensaje queda visible sobre el teclado. Ningún mensaje queda oculto bajo el header.
- Repetir en iOS (Dynamic Island) y Android (gestos y botones).
- Verificar que la PWA en Safari/Chrome sigue igual (sin regresión).