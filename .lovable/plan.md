## Objetivo

Preparar `capacitor_android_release` en `codemagic.yaml` para generar la nueva versión de Android con **versionName = `4`** (ya existía una versión 3 en Play), y alinear el `applicationId` a `com.hanging360.app`. iOS se queda en `0.4` sin tocar.

## Cambios en `codemagic.yaml` (solo workflow Android)

### 1. Variables
```yaml
vars:
  PACKAGE_NAME: "com.hanging360.app"
  VERSION_NAME: "4"   # antes 0.4
```

### 2. Nuevo paso "Force applicationId and version" antes del build
Equivalente al que ya tiene iOS. Garantiza que el AAB/APK salga con el package y versión correctos aunque los fuentes tengan otros valores:

```bash
sed -i '' 's/com.hanging360.tech/com.hanging360.app/g' android/app/build.gradle
sed -i '' 's/com.hanging360.tech/com.hanging360.app/g' android/app/src/main/res/values/strings.xml
sed -i '' "s/versionName \"[^\"]*\"/versionName \"$VERSION_NAME\"/" android/app/build.gradle
sed -i '' "s/versionCode [0-9]*/versionCode $BUILD_NUMBER/" android/app/build.gradle
```

En el runner macOS de Codemagic `sed -i ''` es la sintaxis correcta (igual que en el paso iOS).

### 3. `gradlew` sigue recibiendo overrides
```bash
./gradlew :app:bundleRelease :app:assembleRelease \
  -PversionName=$VERSION_NAME \
  -PversionCode=$BUILD_NUMBER
```
Sin cambios — refuerza los valores por si `build.gradle` los lee vía `project.properties`.

## Qué NO cambia

- Workflow iOS (`capacitor_ios_release`) queda intacto en `0.4`.
- Firma con `hanging360_keystore`.
- Frontend, Supabase, Capacitor config.
- `.github/workflows/android-build.yml` (solo debug).

## Después

Lanzar `capacitor_android_release`. Artefactos en:
- `android/app/build/outputs/bundle/release/app-release.aab`
- `android/app/build/outputs/apk/release/app-release.apk`

con `versionName=4`, `versionCode=$BUILD_NUMBER`, `applicationId=com.hanging360.app`.
