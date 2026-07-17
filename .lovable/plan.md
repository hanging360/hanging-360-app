## Objetivo
Google Play rechaza el AAB por dos motivos:
1. `versionCode 1` ya fue usado en un envío anterior.
2. El paquete debe ser `com.hanging360.app` (no `com.hanging360.tech`).

## Cambios

### 1. `android/app/build.gradle`
- Cambiar `applicationId` y `namespace` a `com.hanging360.app` de forma permanente (dejar de depender del `sed` en Codemagic, que solo parchea a veces).
- Subir el `versionCode` base a `10` y el `versionName` a `"4"` para tener un valor válido aunque Codemagic no inyecte `BUILD_NUMBER`.
- Leer `versionCode` y `versionName` desde propiedades Gradle (`-PversionCode`, `-PversionName`) si vienen definidas, con fallback a los valores anteriores.

### 2. `android/app/src/main/res/values/strings.xml`
- `package_name` y `custom_url_scheme` → `com.hanging360.app`.
- `app_name` se mantiene "Hanging360".

### 3. `codemagic.yaml` (workflow `capacitor_android_release`)
- `VERSION_NAME: "4"` (ya está) y añadir `VERSION_CODE_BASE: "10"`.
- Calcular `EFFECTIVE_VERSION_CODE = max(BUILD_NUMBER, VERSION_CODE_BASE)` para nunca volver a subir `versionCode 1`.
- Pasar `-PversionCode=$EFFECTIVE_VERSION_CODE -PversionName=$VERSION_NAME` a Gradle.
- Añadir un paso "Verify AAB package + versionCode" que use `bundletool`/`aapt2 dump badging` (o `unzip -p .../BundleConfig.pb` + `aapt2 dump badging base.apk`) para abortar si el AAB no reporta `package=com.hanging360.app` o `versionCode>=10`.
- Quitar el `sed` de `com.hanging360.tech → com.hanging360.app` (ya no será necesario porque el código fuente ya trae el ID correcto), pero dejar el paso que sobreescribe `versionCode`/`versionName` como salvaguarda.

### 4. Sanity check local (solo lectura)
- Verificar que `AndroidManifest.xml`, `MainActivity` (paquete Java `com.hanging360.tech`) y `google-services.json` siguen siendo compatibles tras el rename del `applicationId`. El paquete Java puede quedarse en `com.hanging360.tech` porque `namespace`/`applicationId` son independientes; solo hay que asegurarse de que `google-services.json` incluya `com.hanging360.app` — si no, habrá que regenerarlo desde Firebase (paso manual del usuario).

## Resultado esperado
- El próximo build produce `app-release.aab` con `package=com.hanging360.app` y `versionCode` ≥ 10, firmado con `hanging360_keystore_original`, aceptado por Google Play.
