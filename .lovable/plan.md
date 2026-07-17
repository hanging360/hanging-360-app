## Problema

`xcode-project build-ipa` **no acepta** un archive ya generado — solo puede crear el archive desde cero (`--archive-directory` es el directorio de salida, no de entrada). Por eso rechaza `--archive` como ambiguo.

El archive ya está firmado correctamente. Solo hay que exportar el `.ipa` desde ese `.xcarchive` existente usando `xcodebuild -exportArchive` directo (sin `xcode-project`).

## Cambio único en `codemagic.yaml`

En el paso **Build signed IPA**, reemplazar el bloque final `xcode-project build-ipa …` por un export nativo con `xcodebuild`:

```bash
echo "=== Archive OK — exporting IPA ==="
EXPORT_DIR="$CM_BUILD_DIR/build/ios/ipa"
mkdir -p "$EXPORT_DIR"

# ExportOptions.plist para App Store con firma manual
cat > /tmp/ExportOptions.plist <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store</string>
  <key>teamID</key><string>${DEVELOPMENT_TEAM}</string>
  <key>signingStyle</key><string>manual</string>
  <key>stripSwiftSymbols</key><true/>
  <key>uploadBitcode</key><false/>
  <key>uploadSymbols</key><true/>
  <key>provisioningProfiles</key>
  <dict>
    <key>${BUNDLE_ID}</key><string>${PROVISIONING_PROFILE_NAME}</string>
  </dict>
</dict>
</plist>
PLIST

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist /tmp/ExportOptions.plist \
  2>&1 | tee /tmp/xcodebuild_logs/export.log
```

## Qué NO cambia

- El bloque `xcodebuild … archive` (ya funciona).
- Firma, certificados, provisioning profiles.
- Nada de iOS sources, entitlements, Android, ni el frontend.

## Después

Re-lanzar `capacitor_ios_release`. El archive volverá a pasar y el `.ipa` se generará en `build/ios/ipa/App.ipa`, que ya está listado en `artifacts:`.
