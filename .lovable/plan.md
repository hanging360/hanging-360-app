## Problema actual

Codemagic falla con:

```text
App Store Connect integration "app_store_connect_hanging360" does not exist
```

Ese nombre no existe en tu cuenta de Codemagic, así que no debe estar referenciado en el workflow.

## Cambios aplicados

### 1. `codemagic.yaml`

- Se eliminó cualquier dependencia de la integración inexistente `app_store_connect_hanging360`.
- Se mantiene `environment.ios_signing` con:
  - `distribution_type: app_store`
  - `bundle_identifier: com.hanging360.app`
- Se quitó el `ExportOptions.plist` manual.
- Se quitaron los `--archive-xcargs`, `--export-xcargs` y perfiles forzados manualmente.
- Se añadió el flujo estándar de firma:

```yaml
- name: Initialize keychain
  script: keychain initialize

- name: Add certificates to keychain
  script: keychain add-certificates

- name: Apply provisioning profiles to Xcode project
  script: xcode-project use-profiles
```

El build queda simple:

```yaml
xcode-project build-ipa \
  --project "$XCODE_PROJECT" \
  --scheme "$XCODE_SCHEME" \
  --verbose
```

### 2. `capacitor.config.ts`

Se corrigió el `appId` a:

```ts
appId: 'com.hanging360.app'
```

### 3. Proyecto iOS

Se corrigió `PRODUCT_BUNDLE_IDENTIFIER` en `ios/App/App.xcodeproj/project.pbxproj` para usar:

```text
com.hanging360.app
```

## Resultado esperado

Codemagic ya no debe fallar por la integración inexistente:

```text
app_store_connect_hanging360
```

Si aparece otro error, debe ser de certificados/perfiles reales cargados en Codemagic, no por un nombre incorrecto en el YAML.