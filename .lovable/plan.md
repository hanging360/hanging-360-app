## Plan

Forzar el nombre del provisioning profile en `codemagic.yaml` para eliminar ambigüedad al firmar.

### Cambio en `codemagic.yaml` (workflow `capacitor_ios_release`)

1. **Añadir variable de entorno** `PROVISIONING_PROFILE_NAME: "Hanging360 App Store"` en el bloque `vars:`.
   - ⚠️ Necesito confirmar el nombre exacto que dejaste tras la limpieza en Apple Developer. Opciones que teníamos: `Hanging360`, `Hanging360 App Store`, `Hanging360 App Store 1/2`. Dime cuál conservaste.

2. **Modificar el paso `Build signed IPA`** — en la invocación de `xcodebuild archive`, añadir:
   ```
   PROVISIONING_PROFILE_SPECIFIER="$PROVISIONING_PROFILE_NAME" \
   CODE_SIGN_IDENTITY="iPhone Distribution" \
   ```

3. **Añadir al paso `Show code signing settings`** un `echo` del `PROVISIONING_PROFILE_NAME` para verificar en el log antes del archive.

### Qué NO cambia

- Nada de `Package.swift`, entitlements, `Info.plist`, `AppDelegate.swift`, código de app, ni workflow Android.
- Sin cambios en la parte de descarga de profiles (sigue funcionando con App Store Connect API key).

### Después

Correr `capacitor_ios_release`. En el paso `Show code signing settings` debe verse el `PROVISIONING_PROFILE_SPECIFIER` = nombre elegido, y el archive debe completar sin error de `aps-environment`.

**Confirma qué profile dejaste activo** para escribir el nombre exacto en el YAML.
