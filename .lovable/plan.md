## Problema confirmado
La captura muestra que el contenido web termina correctamente al abrir el campo, pero el teclado de iOS no dibuja sus teclas: únicamente aparece la barra nativa de anterior/siguiente/aceptar sobre una superficie blanca. Por tanto, no es el `100dvh`, el scroll ni una versión antigua de la PWA; es la presentación nativa del teclado dentro del `WKWebView` instalado.

El plugin `@capacitor/keyboard` ya no figura en `package.json` ni en `Package.swift`, así que no volveremos a cambiar CSS, altura o resize de la PWA. Además, Capacitor ya establece por defecto `contentInsetAdjustmentBehavior = .never`, por lo que el código adicional de `AppDelegate` que fuerza repetidamente los insets es redundante y se eliminará.

## Arreglo
1. **Restaurar el `WKWebView` estándar de Capacitor en iOS**
   - Quitar de `AppDelegate.swift` la manipulación manual de `contentInset`, `scrollIndicatorInsets` y `contentInsetAdjustmentBehavior`.
   - Dejar que `CAPBridgeViewController` administre el WebView y el teclado sin modificaciones privadas ni observadores.

2. **Fijar explícitamente la política soportada por Capacitor**
   - Declarar `ios.contentInset: 'never'` en `capacitor.config.ts`, en lugar de modificar el `WKWebView` después de crearlo.
   - Mantener ausente `@capacitor/keyboard`; no añadir resize, listeners, offsets ni puentes hacia la PWA.

3. **Validar la integración nativa**
   - Confirmar que Keyboard no reaparece en SPM/Gradle.
   - Sincronizar Capacitor y comprobar que iOS compila con el `AppDelegate` estándar.
   - Probar email, contraseña y chat en iPhone: deben verse las teclas completas inmediatamente y la barra ↑ ↓ ✓ debe quedar pegada encima del teclado, no flotando sobre un bloque blanco.

## Alcance
La imagen prueba un fallo de la capa nativa instalada. Este ajuste requiere actualizar el binario iOS una vez; no modifica la PWA ni obliga a reconstruir futuros cambios web.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>