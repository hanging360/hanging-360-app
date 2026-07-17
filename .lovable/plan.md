## Situación

✅ El archive completó bien: firmado con `iPhone Distribution: Cesar Castellanos` y provisioning `Hanging360 App Store`. El problema del `aps-environment` ya está resuelto.

❌ El único fallo restante está en el paso de exportar IPA:

```
xcode-project: error: unrecognized arguments: --archive-path ...
```

El CLI de Codemagic (`xcode-project build-ipa`) usa el flag `--archive` (o `--archive-directory`), no `--archive-path`.

## Cambio único en `codemagic.yaml`

En el paso `Build signed IPA`, reemplazar:

```
xcode-project build-ipa \
  --archive-path "$ARCHIVE_PATH" \
  --verbose
```

por:

```
xcode-project build-ipa \
  --archive "$ARCHIVE_PATH" \
  --verbose
```

## Qué NO cambia

- Nada del bloque de `xcodebuild archive` (ya funciona).
- Nada de `Package.swift`, entitlements, `Info.plist`, `AppDelegate.swift`.
- Nada del workflow Android.
- Nada de firma/certificados/profiles.

## Después

Re-lanzar `capacitor_ios_release`. El archive volverá a pasar y esta vez el `build-ipa` debe generar el `.ipa` en `build/ios/ipa/`.
