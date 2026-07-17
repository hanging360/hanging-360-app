## Problema

`xcodebuild ... archive` sale con código 65 pero **no vemos el error real** en el log. El paso "Print xcodebuild logs" nunca corre porque Codemagic detiene el workflow al fallar el paso anterior. El SPM y `Package.swift` están correctos (verifiqué los nombres de productos de los 4 plugins nuevos), así que el fallo está en compilación/firma pero está oculto.

## Plan

Modificar `codemagic.yaml` (workflow `capacitor_ios_release`) para exponer el error real antes de arreglarlo:

1. **Reemplazar el paso `Build signed IPA`** por una versión que:
   - Ejecute primero `xcodebuild ... archive` a mano con salida redirigida a `/tmp/xcodebuild_logs/archive.log` (además de stdout via `tee`).
   - Si falla, imprima con `tail -n 500` y también los últimos errores filtrados con `grep -E "error:|warning:|note:"`.
   - Solo si el archive tiene éxito, llame a `xcode-project build-ipa` (que reutilizará el `.xcarchive`).

2. **Cambiar `Print xcodebuild logs`** para que corra siempre (`ignore_failure: true` en el paso anterior + este siempre imprime), y suba `archive.log` como artifact.

3. **Añadir un paso previo `Preflight SPM resolve`** que ejecute:
   ```
   xcodebuild -resolvePackageDependencies -project ios/App/App.xcodeproj -scheme App -clonedSourcePackagesDirPath /tmp/spm 2>&1 | tee /tmp/xcodebuild_logs/spm.log
   ```
   Así, si algún plugin no resuelve, lo vemos antes del archive.

4. **Añadir `archive.log` y `spm.log` a `artifacts:`** para poder descargarlos desde Codemagic si el email trunca.

## Qué NO cambia en este paso

- No toco `Package.swift` (ya está correcto).
- No toco código de la app, `Info.plist`, `AppDelegate.swift`, ni el flujo de Android.
- No cambio versiones ni firma.

## Siguiente iteración

Cuando corras el build y me mandes el `archive.log` (o el nuevo tail que ahora sí saldrá), diagnosticaré la causa real (probablemente firma manual vs automática, deployment target, o un símbolo faltante en un plugin) y aplicaré el fix puntual.
