
# Fix: iOS usa SPM, no CocoaPods

## Diagnóstico
El proyecto iOS está configurado con **Swift Package Manager** (`ios/App/CapApp-SPM/Package.swift`), no CocoaPods. Por eso:
- `ios/App/Pods` no existe → el step `Verify notification plugins` falla.
- `pod install --repo-update` no aporta nada (y puede fallar si no hay `Podfile`).
- Los plugins nuevos (`@capacitor/local-notifications`, `@capacitor/app`, `@capawesome/capacitor-badge`) **no están declarados en `Package.swift`**, así que aunque estén en `node_modules` no se linkean al binario iOS. Ese es el problema real detrás del error de Apple/Codemagic.

## Cambios

### 1. `ios/App/CapApp-SPM/Package.swift`
Añadir los 3 paquetes locales y sus productos:
- `CapacitorLocalNotifications` → `../../../node_modules/@capacitor/local-notifications`
- `CapacitorApp` → `../../../node_modules/@capacitor/app`
- `CapawesomeCapacitorBadge` → `../../../node_modules/@capawesome/capacitor-badge`

Agregarlos como `.package(name:, path:)` en `dependencies` y como `.product(name:, package:)` en el target `CapApp-SPM`.

### 2. `codemagic.yaml` — workflow `capacitor_ios_release`
- **Eliminar** el step `Install CocoaPods dependencies` (no hay Podfile).
- **Eliminar** `cocoapods: default` del `environment` y las rutas `~/Library/Caches/CocoaPods`, `~/.cocoapods/repos`, `ios/App/Pods` del cache.
- **Reemplazar** el step `Verify notification plugins` por una verificación SPM:
  ```yaml
  - name: Verify notification plugins
    script: |
      cd ios/App
      grep -E "CapacitorPushNotifications|CapacitorLocalNotifications|CapacitorApp|CapawesomeCapacitorBadge" CapApp-SPM/Package.swift \
        || (echo "Missing notification plugins in Package.swift" && exit 1)
      # Fuerza resolución SPM antes del build
      xcodebuild -resolvePackageDependencies -project App.xcodeproj -scheme App || true
  ```
- Añadir cache SPM: `- ~/Library/Developer/Xcode/DerivedData/**/SourcePackages`.

### 3. `NOTIFICATIONS_SETUP.md`
Actualizar la sección iOS: aclarar que se usa SPM (no CocoaPods) y que agregar plugins requiere editar `CapApp-SPM/Package.swift` + `npx cap sync ios`.

## Fuera de scope
No se toca lógica de portal, RBAC, Supabase, ni el workflow Android.
