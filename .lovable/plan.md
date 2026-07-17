## Objetivo
Hacer que Codemagic ejecute el flujo Android y entregue `app-release.aab` firmado con el keystore válido, en lugar de seleccionar iOS y producir únicamente el IPA.

## Cambios en `codemagic.yaml`

1. **Reordenar workflows**: mover `capacitor_android_release` al inicio de `workflows:` para que sea el flujo principal cuando Codemagic lee el YAML.

2. **Actualizar keystore de firma** en `capacitor_android_release.environment.android_signing`:
   - Reemplazar `hanging360_keystore` (sin metadatos, expirado/roto) por **`hanging360_keystore_v2`** (CN=hanging360_keystore, válido hasta julio 2053).
   - Este es el keystore que se usará para firmar el `.aab` destinado a Google Play.

3. **Añadir `triggering` a ambos workflows** para que cada push a `main` dispare Android automáticamente (y opcionalmente iOS), sin depender de la selección por defecto del dashboard:
   ```yaml
   triggering:
     events: [push]
     branch_patterns:
       - pattern: main
         include: true
         source: true
   ```

4. **Corregir `sed -i ''`** (sintaxis macOS) en el paso "Force applicationId and version" del flujo Android — el runner Android es Linux, requiere `sed -i` sin las comillas vacías. Sin esto, `applicationId`, `namespace`, `versionName` y `versionCode` no se están reescribiendo y el AAB sale con `com.hanging360.tech` v1.0.

5. **Verificar artefacto final**: mantener `artifacts: android/app/build/outputs/**/*.aab` y añadir un paso de validación `ls android/app/build/outputs/bundle/release/*.aab` que falle explícitamente si no se generó el bundle.

## Fuera de alcance
No se toca el workflow iOS ni el `capacitor.config.ts`.

## Resultado esperado
Cada push a `main` ejecuta **Capacitor Android Release** → produce `app-release.aab` firmado con `hanging360_keystore_v2` (válido hasta 2053), `applicationId=com.hanging360.app`, `versionName=4`, `versionCode=$BUILD_NUMBER`, listo para subir a Google Play.