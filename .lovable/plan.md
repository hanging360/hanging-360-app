## Objetivo
Hacer que la app Capacitor muestre la misma versión y el mismo comportamiento de teclado que `tech.hanging360.com`, sin el espacio blanco ni el desplazamiento doble.

## Diagnóstico confirmado
- Capacitor abre directamente `https://tech.hanging360.com/my-appointment` mediante `server.url`.
- Con esa arquitectura, `AppShell.tsx` y sus listeners/correcciones de teclado **no se ejecutan** dentro de la app instalada.
- Android aplica simultáneamente `adjustResize`, WebView edge-to-edge y `Keyboard.resize: native`; esta combinación puede reajustar dos veces la página que ya maneja correctamente el teclado en web/PWA.
- La comprobación remota tampoco está completa: `https://tech.hanging360.com/version.json` sigue devolviendo la página 404, no un archivo de versión.

## Cambios
1. **Dejar una sola estrategia de teclado**
   - Mantener la carga directa por `server.url`.
   - Cambiar Capacitor Keyboard a modo `none`, para que el shell no vuelva a redimensionar una página que ya funciona correctamente con `visualViewport`/`100dvh`.
   - En Android sustituir `adjustResize` por `adjustNothing` y eliminar cualquier redimensionamiento nativo duplicado.
   - En iOS eliminar las claves `KeyboardResize=native` que fuerzan el reajuste adicional.

2. **Quitar correcciones que actualmente son código muerto**
   - Retirar del `AppShell` la lógica manual de altura de teclado/viewport que no participa cuando existe `server.url`, evitando mantener dos soluciones contradictorias.
   - No tocar cookies, localStorage, IndexedDB ni credenciales.

3. **Carga siempre revalidada de la web publicada**
   - Conservar la limpieza exclusiva de caché HTTP en arranque, sin borrar sesión.
   - Revalidar la URL remota al arrancar y al volver del background, con protección para no crear bucles de recarga ni interrumpir formularios activos.
   - Confirmar que la navegación solicita el hash actual del JavaScript publicado.

4. **Completar el control de versión en el proyecto PWA**
   - Publicar `/version.json` real con `Cache-Control: no-store` desde el proyecto `tech.hanging360.com`.
   - Compararlo al iniciar, después del login y al volver al foreground; recargar una sola vez únicamente cuando cambie la versión.
   - Este paso pertenece a la PWA y permitirá que futuros despliegues entren sin nuevos IPA/AAB.

5. **Validación móvil**
   - Probar abrir/cerrar el teclado en el chat: header fijo, lista de mensajes desplazable y composer justo encima del teclado, sin espacio blanco.
   - Probar cierre/reapertura y foreground: versión vigente, sesión y permisos conservados.

## Publicación necesaria
La app que ya está instalada contiene la política nativa incorrecta de teclado; cambiarla exige **un último `git pull`, `npx cap sync` y rebuild de IPA/AAB**. Después de instalar esa versión corregida, las actualizaciones normales de la PWA se cargarán remotamente sin reconstruir la app.

Al implementar, consultar también la guía oficial de Capacitor para sincronización y pruebas nativas.