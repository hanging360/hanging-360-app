## Plan

1. **Corregir `codemagic.yaml`**
   - Quitar `integrations.app_store_connect: app_store_connect_hanging360`, porque Codemagic dice que esa integración no existe.
   - Mantener `environment.ios_signing` con:
     - `distribution_type: app_store`
     - `bundle_identifier: com.hanging360.app`
   - Usar el flujo estándar de Codemagic con `keychain initialize`, `keychain add-certificates` y `xcode-project use-profiles` sin apuntar a un nombre de integración inexistente.

2. **Mantener el Bundle ID correcto**
   - Confirmar que Capacitor use `appId: com.hanging360.app`.
   - Mantener el paso que fuerza `PRODUCT_BUNDLE_IDENTIFIER` en el proyecto iOS antes de aplicar perfiles.

3. **Evitar el error anterior de provisioning**
   - No volver a crear `ExportOptions.plist` manual.
   - No pasar `--archive-xcargs` conflictivos al `xcode-project build-ipa`.
   - Dejar que `xcode-project use-profiles` aplique el perfil instalado por Codemagic.

4. **Actualizar `.lovable/plan.md`**
   - Documentar que el problema actual es la integración inexistente y que la solución es no referenciar `app_store_connect_hanging360` salvo que exista exactamente con ese nombre en Codemagic.

## Resultado esperado

Codemagic ya no debe fallar con:

```text
App Store Connect integration "app_store_connect_hanging360" does not exist
```

El siguiente posible fallo, si aparece, ya sería sobre certificados/perfiles reales configurados en Codemagic, no por un nombre inventado en el YAML.