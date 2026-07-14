Voy a corregir el splash para que no use un logo con fondo blanco.

Actualización:
- El problema visible ahora no es solo el PNG del splash: Capacitor estaba manteniendo su pantalla nativa hasta que el iframe del portal terminaba de cargar, por eso se veía el logo de Capacitor durante ~17 segundos.
- Se configuró `SplashScreen` para auto-ocultarse casi de inmediato y también se llama `SplashScreen.hide()` al arrancar la app nativa, antes de esperar al iframe.
- El portal seguirá cargando con la pantalla web propia de la app, no con la pantalla/logo de Capacitor.

Plan:
1. Usar la imagen que subiste como fuente del logo, pero procesarla para hacer transparente el fondo blanco exterior.
2. Regenerar todos los splash nativos:
   - Android: `android/app/src/main/res/drawable* / splash.png`
   - iOS: `ios/App/App/Assets.xcassets/Splash.imageset/*`
3. Dejar el fondo del splash en oscuro `#1a1a1a`, con el logo centrado encima sin bloque/cuadrado blanco alrededor.
4. Revisar también la configuración Android del launch theme para asegurar que usa el PNG correcto.
5. Al terminar, te indicaré que hagas `git pull` y luego `npx cap sync` antes de volver a compilar la app.

Detalle técnico:
- El cuadrado blanco probablemente no viene del splash en sí, sino del archivo de logo usado para generarlo: la imagen tiene fondo blanco opaco. Hay que convertir ese blanco exterior a transparencia antes de pegar el logo sobre el fondo oscuro.