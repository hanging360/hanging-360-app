# Cambiar el icono de la app (Capacitor + Home Screen/PWA)

Vamos a reemplazar todos los iconos de la app con el nuevo logo que subiste (`Hanging360_App_Icon_512.png`).

## Qué se va a hacer

1. **Guardar el nuevo icono maestro** en el proyecto como `src/assets/app-icon.png` (fuente de verdad).

2. **PWA / Home Screen (web instalable)**
   - Regenerar `public/app-icon-192.png` (192x192).
   - Regenerar `public/app-icon-512.png` (512x512).
   - Reemplazar `public/favicon.ico` (y añadir `favicon.png`) con el nuevo logo.
   - Verificar que `public/manifest.json` sigue apuntando a esos iconos (ya lo hace).
   - Actualizar el `<link rel="icon">` en `index.html` si hace falta.

3. **iOS (Capacitor)**
   - Reemplazar `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (1024x1024) con el nuevo logo.

4. **Android (Capacitor)**
   - Regenerar los `ic_launcher.png` y `ic_launcher_round.png` en:
     `mipmap-mdpi`, `mipmap-hdpi`, `mipmap-xhdpi`, `mipmap-xxhdpi`, `mipmap-xxxhdpi`.
   - Regenerar `ic_launcher_foreground.png` (adaptive icon foreground) en las 5 densidades.
   - Cambiar `ic_launcher_background` a blanco (ya está `#FFFFFF`) o al color del logo — se mantiene blanco para que respire el círculo del logo.
   - Los `.xml` adaptive-icon actuales seguirán funcionando (apuntan a `@mipmap/ic_launcher_foreground` y `@color/ic_launcher_background`).

## Detalles técnicos

- Se usará `sharp` (o ImageMagick vía `nix`) en el sandbox para generar todas las variantes de tamaño desde el PNG maestro 512x512. Como el original es 512, para el ícono iOS de 1024 se hará upscale simple (el arte es plano/vectorial, se ve bien).
- Densidades Android mipmap: mdpi=48, hdpi=72, xhdpi=96, xxhdpi=144, xxxhdpi=192. Foreground adaptive: mdpi=108, hdpi=162, xhdpi=216, xxhdpi=324, xxxhdpi=432.
- Después del cambio, el usuario deberá hacer `git pull` → `npm install` → `npx cap sync` para que los iconos nativos se apliquen en la próxima build de iOS/Android.

## Nota

El splash screen (`ios/.../Splash.imageset`, Android splash) **no** se toca en este plan. Si también lo quieres cambiar, dímelo y lo agrego.
