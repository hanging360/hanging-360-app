Voy a corregir el splash para que no use un logo con fondo blanco.

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