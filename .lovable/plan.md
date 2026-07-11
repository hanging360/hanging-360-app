# Fix: Splash de Capacitor muestra cuadro blanco en vez del logo

## Diagnóstico

Los archivos `splash.png` actuales son los **placeholders por defecto de Capacitor** (imágenes casi vacías, 4–41 KB, sin logo). Por eso al abrir la app se ve solo un cuadro blanco antes de que cargue la web:

- `android/app/src/main/res/drawable*/splash.png` (11 archivos, todos genéricos)
- `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732*.png` (3 archivos genéricos)

El logo real vive en `src/assets/app-icon.png` (512×512) y `public/app-icon-512.png`.

## Plan

1. **Generar un splash maestro 2732×2732** con:
   - Fondo `#1a1a1a` (mismo tema que la app / `theme-color`).
   - Logo de la app (`src/assets/app-icon.png`) centrado, ~35 % del lado.
   - Guardarlo como `/tmp/splash-master.png`.

2. **Regenerar todos los splash de Android** (redimensionando el maestro al tamaño exacto que Capacitor espera en cada bucket):

   ```
   drawable/splash.png                480x320
   drawable-port-mdpi/splash.png      320x480
   drawable-port-hdpi/splash.png      480x800
   drawable-port-xhdpi/splash.png     720x1280
   drawable-port-xxhdpi/splash.png    960x1600
   drawable-port-xxxhdpi/splash.png   1280x1920
   drawable-land-*                    (versión landscape del mismo)
   ```

3. **Regenerar los 3 splash de iOS** en `Splash.imageset/` (todos 2732×2732, que es lo que espera `LaunchScreen.storyboard` via el asset `Splash`):
   - `splash-2732x2732.png`
   - `splash-2732x2732-1.png`
   - `splash-2732x2732-2.png`

4. **No tocar**: `capacitor.config.ts`, `LaunchScreen.storyboard`, `AndroidManifest.xml`, ni el icono de la app — solo se reemplazan los PNG de splash.

## Detalles técnicos

- Se usa Pillow (`PIL`) para componer fondo + logo centrado y exportar cada tamaño requerido, respetando orientación portrait/landscape en Android.
- Tras aplicar el cambio, el usuario debe hacer `git pull` y `npx cap sync` para que Android Studio / Xcode empaqueten los nuevos assets en el próximo build (TestFlight / APK).
- No requiere cambios de código en `src/` ni migraciones.
