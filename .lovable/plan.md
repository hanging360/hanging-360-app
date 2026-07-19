## Problema exacto
La captura confirma que no es un fallo visual de la PWA: iOS está reduciendo el `WKWebView` y deja una superficie blanca del tamaño del teclado. Aunque se eliminó la configuración `Keyboard` de `capacitor.config.ts`, el plugin `@capacitor/keyboard` sigue instalado y registrado en el proyecto nativo (`Package.swift` en iOS y `capacitor.build.gradle` en Android). Por eso el shell todavía puede intervenir sobre el viewport.

## Cambios
1. **Desinstalar completamente `@capacitor/keyboard`**
   - Retirarlo de `package.json` y del lockfile.
   - Eliminarlo de la integración nativa iOS/Android mediante la sincronización de Capacitor, en vez de limitarse a quitar su bloque de configuración.
   - Quitar el wrapper `Keyboard` que ya no debe existir en el shell.

2. **Dejar iOS como WebView transparente**
   - Mantener `AppDelegate.swift` sin observadores ni manipulación del teclado.
   - Configurar el `WKWebView` para que no añada insets automáticos extra al scroll y restablecer cualquier inset inferior residual.
   - No alterar el DOM, `100dvh` ni el CSS de la PWA remota.

3. **Evitar una política incorrecta equivalente en Android**
   - Mantener el shell sin plugin Keyboard.
   - Cambiar `adjustNothing` por el comportamiento estándar compatible con una PWA que usa `visualViewport`, evitando congelar o desplazar incorrectamente el WebView.

4. **Validación nativa**
   - Confirmar que el plugin Keyboard ya no aparece en las dependencias nativas generadas.
   - Verificar compilación y sincronización de iOS/Android.
   - Probar login y chat con teclado: la página debe conservar el alto visible, sin cuadro blanco, y solo el navegador/PWA debe responder al teclado.

## Alcance de publicación
Este defecto está dentro del binario nativo ya instalado, no en la página publicada. La corrección exige una actualización final de IPA/AAB porque hay que retirar el plugin que está compilado dentro de Capacitor; después, los cambios de contenido y layout de la PWA seguirán llegando remotamente sin reconstruir la app.