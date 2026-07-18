## Do I know what the issue is?

Sí. La configuración actual de Capacitor carga `https://tech.hanging360.com/my-appointment` directamente como documento principal mediante `server.url`. Por eso los ajustes anteriores en `AppShell.tsx` y `src/index.css` no se ejecutan en la app instalada.

Hay dos problemas nativos distintos:

1. `Keyboard.resize: 'native'` redimensiona el WKWebView completo mientras el portal remoto también ajusta su layout al teclado; esa combinación crea el segundo scroll y el gran espacio blanco.
2. En iOS el status bar queda visible, pero no existe una configuración nativa explícita que controle si el WebView debe superponerse o colocarse debajo. El portal además conserva su propio espacio superior, produciendo la separación de casi media pulgada que se ve entre la línea visible del display y el header.

## Plan de implementación

1. **Eliminar el doble ajuste del teclado**
   - Cambiar `Keyboard.resize` de `native` a `body`, que redimensiona el cuerpo del portal sin encoger otra vez el WKWebView completo.
   - Mantener `resizeOnFullScreen` solo como soporte de Android inmersivo.
   - No modificar la barra pequeña con flechas y ✓ porque es el accesorio nativo normal de iOS; se corregirá únicamente el espacio blanco grande.

2. **Corregir el espacio superior de iOS**
   - Configurar explícitamente `StatusBar.overlaysWebView` para que el WebView comience debajo del status bar y no acumule un segundo margen/safe-area.
   - Establecer el estilo/fondo del status bar de forma coherente con el header blanco.
   - Aplicar el comportamiento equivalente en el arranque nativo de iOS para que funcione aunque `server.url` omita el shell React.

3. **Retirar compensaciones que ya no corresponden**
   - Eliminar de `AppShell.tsx` la resta manual de `keyboardHeight` y sus listeners, evitando que el problema vuelva si más adelante se restaura el shell local.
   - Simplificar las alturas del contenedor local para que dependan del viewport entregado por Capacitor, sin doble cálculo.

4. **Verificación**
   - Confirmar la configuración nativa generada después del sync.
   - Validar apertura/cierre repetido del teclado y cambio entre campos: no debe aparecer scroll inferior ni espacio blanco.
   - Validar iPhone con notch/Dynamic Island: el header debe quedar inmediatamente debajo del área segura, sin hueco duplicado.
   - Revisar Android para asegurar que el modo inmersivo y el teclado continúan funcionando.

Para probar el arreglo en la app instalada habrá que hacer `git pull`, `npm install`, `npm run build`, `npx cap sync` y generar un nuevo IPA/AAB.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>