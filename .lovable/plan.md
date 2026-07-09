## Problema

El archive falla con:
> "App" requires a provisioning profile.

Codemagic descarga el perfil con `ios_signing` (App Store Connect API), pero:

1. Nunca ejecutas `xcode-project use-profiles`, que es el paso que aplica el perfil descargado al `.xcodeproj` (setea `PROVISIONING_PROFILE_SPECIFIER`, `CODE_SIGN_IDENTITY`, `CODE_SIGN_STYLE=Manual` y `DEVELOPMENT_TEAM`).
2. Codemagic detecta que no hay perfil aplicado y por eso el archive se lanza con `CODE_SIGN_STYLE=Manual` sin `PROVISIONING_PROFILE_SPECIFIER` → error 65.
3. Además `ExportOptions.plist` dice `signingStyle=automatic`, lo que entra en conflicto con el Manual del archive. Debe ser `manual` cuando usas `ios_signing` de Codemagic.
4. Falta también un `keychain initialize` antes de instalar los certificados/perfiles (recomendado por Codemagic).

## Cambios (solo `codemagic.yaml`)

### A) Añadir pasos de firma antes del build

Antes del step "Build signed IPA":

```yaml
- name: Initialize keychain
  script: keychain initialize

- name: Fetch signing files
  script: |
    app-store-connect fetch-signing-files "$BUNDLE_ID" \
      --type IOS_APP_STORE \
      --create

- name: Add certificates to keychain
  script: keychain add-certificates

- name: Apply provisioning profiles to Xcode project
  script: xcode-project use-profiles
```

Esto requiere que en Codemagic tengas configurada la integración **App Store Connect API key** (Team ID C427U3735D). Si ya tienes `ios_signing.distribution_type: app_store` con integración conectada, estos comandos usan esa key automáticamente. Si no está conectada, hay que crearla en Codemagic → Teams → Integrations → App Store Connect y referenciarla en `integrations:` del workflow.

### B) Simplificar el `Build signed IPA`

Quitar los xcargs que forzaban valores y dejar que use lo que ya está aplicado en el `.xcodeproj`:

```yaml
- name: Build signed IPA
  script: |
    xcode-project build-ipa \
      --project "$XCODE_PROJECT" \
      --scheme "$XCODE_SCHEME"
```

`xcode-project build-ipa` genera su propio `ExportOptions.plist` correcto a partir de los perfiles aplicados, así que se puede eliminar todo el step "Create ExportOptions.plist" y el flag `--export-options-plist`.

### C) Añadir la integración al workflow

```yaml
environment:
  ios_signing:
    distribution_type: app_store
    bundle_identifier: com.hanging360.app
  groups:
    - app_store_credentials   # opcional, si usas grupos
  # NUEVO:
integrations:
  app_store_connect: <nombre-de-tu-integración-en-Codemagic>
```

### D) Mantener el `Force Bundle ID` antes de `use-profiles`

El orden importa: primero `sed` que fija `com.hanging360.app` en el pbxproj, después `use-profiles` para que el perfil se aplique al bundle ID correcto.

## Orden final de steps

1. Validate toolchain
2. Validate signing assets
3. Install JS dependencies
4. Build web app
5. Sync Capacitor iOS
6. Install CocoaPods
7. Force Bundle ID and version
8. **Initialize keychain** (nuevo)
9. **Fetch signing files** (nuevo)
10. **Add certificates to keychain** (nuevo)
11. **Apply provisioning profiles** (nuevo)
12. Show code signing settings (verificación)
13. Build signed IPA (simplificado)
14. Print xcodebuild logs

## Requisito manual en Codemagic (no es código)

En **Codemagic UI → Teams → Personal Account → Integrations → Developer Portal / App Store Connect**:
- Sube tu App Store Connect API key (Issuer ID, Key ID, .p8).
- Nombra la integración, p.ej. `app_store_connect_hanging360`.
- Referénciala en `integrations.app_store_connect` del workflow.

Sin esa integración conectada, `fetch-signing-files` fallará porque no tiene credenciales para crear/descargar el perfil.

¿Confirmas que ya tienes la App Store Connect API key subida a Codemagic? Si no, primero hay que crearla; si sí, dame el nombre exacto de la integración para ponerlo en el YAML.
