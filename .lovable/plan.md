## Problema exacto
La PWA publicada y el wrapper nativo están usando políticas incompatibles:

- El wrapper Capacitor ya no incluye `@capacitor/keyboard`.
- La PWA todavía intenta escuchar ese plugin y, al mismo tiempo, aplica `visualViewport`, `100dvh`, alturas/offsets propios y clases `keyboard-open`.
- En iOS, `visualViewport` dentro de Capacitor no refleja el teclado igual que Safari. Cuando no llega el evento del plugin, quedan alturas y posiciones inconsistentes: aparece la superficie blanca, la barra ↑ ↓ ✓ queda flotando, el chat se mete bajo “Info cliente” y el compositor oculta mensajes.
- El ajuste universal de Apple para `.safe-area-top` añade como mínimo 8 px incluso cuando el WebView ya entregó el área segura, explicando la separación adicional del header dentro de Capacitor.

## Implementación coordinada

### 1. Wrapper Capacitor: restaurar una sola fuente nativa para el teclado
- Reinstalar `@capacitor/keyboard` con la misma versión mayor de Capacitor.
- Configurar iOS con `Keyboard.resize: 'none'`: el WebView conserva su tamaño y la PWA recibe `keyboardWillShow/keyboardWillHide` para controlar únicamente su layout.
- Mantener `ios.contentInset: 'never'` y eliminar cualquier ajuste manual de frame/insets.
- En Android usar `adjustNothing`, para evitar que Android reduzca el WebView además del ajuste realizado por la PWA.
- No añadir cálculos ni CSS de teclado al wrapper.

### 2. PWA: eliminar el manejo duplicado
- Hacer que `nativeKeyboard.ts` sea la única fuente de estado cuando `Capacitor.isNativePlatform()` sea verdadero.
- En modo nativo, usar exclusivamente la altura de `keyboardWillShow/keyboardWillHide`; no combinarla con diferencias de `visualViewport`.
- En navegador/PWA instalado, conservar `visualViewport` como fallback, sin acceder al plugin.
- Limpiar siempre clases y variables al cerrar teclado, cambiar de ruta, volver del background o desmontar componentes, evitando offsets persistentes.

### 3. Layout del chat
- Mantener un contenedor raíz fijo a la altura visual disponible.
- Dejar “Info cliente” en una fila superior estable.
- Convertir solo la lista de mensajes en la zona desplazable (`min-height: 0; overflow-y: auto`).
- Anclar el compositor inmediatamente encima del teclado mediante la variable nativa, sin desplazar toda la página.
- Al enfocar el input o cambiar la altura del teclado, desplazar la conversación al mensaje activo/último mensaje para que siga legible.

### 4. Safe-area y cambios de Apple
- Quitar el mínimo universal de 8 px de `.safe-area-top`; usar únicamente `env(safe-area-inset-top, 0px)`.
- Aplicar safe-area una sola vez en el header raíz, no también en contenedores internos.
- Conservar objetivos táctiles de 44×44 px, pero desacoplarlos de padding, altura de página y viewport.

### 5. Validación
- Verificar login, contraseña, diálogos y chat en Safari/PWA sin regresión.
- Verificar en Capacitor iOS que el teclado completo aparezca, la barra ↑ ↓ ✓ quede sobre las teclas y no exista bloque blanco.
- Verificar que “Info cliente” permanezca visible, solo se desplace la lista y el compositor quede sobre el teclado.
- Verificar Android con el mismo comportamiento y sin doble resize.

## Entrega
Este cambio requiere una sincronización y un rebuild final del wrapper porque restaura el plugin nativo. Después, futuras correcciones visuales del chat, sonidos y contenido seguirán publicándose desde la PWA sin nuevos IPA/AAB.