## Verificación

Ejecuté `keytool` sobre el `.keystore` que subiste. Resultado:

- **Alias real:** `hanging360-key` (no `Hanging360` — importante, si pones el alias mal la firma falla)
- **Store password:** `@Cr043079` ✓
- **SHA1:** `19:8C:5D:7C:08:5A:7E:BD:54:BE:22:E1:9D:E9:72:65:6E:02:DD:E0` ✓ **coincide con lo que Play exige**
- Owner: `CN=Hanging360, OU=Hanging360, O=Hanging360, L=Miami, ST=Florida, C=US`
- Válido hasta 2053

Este ES el keystore correcto.

## Pasos

### 1. Subir el keystore a Codemagic (lo haces tú)

Codemagic → **Teams → Code signing identities → Android keystores → Add keystore**:

- **Reference name:** `hanging360_keystore_original`
- **Upload keystore file:** `hanging360-release-key.keystore` (el mismo que subiste aquí)
- **Keystore password:** `@Cr043079`
- **Key alias:** `hanging360-key`  ← ojo, con guion, minúsculas
- **Key password:** `@Cr043079` (si Codemagic la pide y `hanging360` no funciona, prueba con la del store; los keystores nuevos suelen usar la misma para ambas)

Codemagic mostrará la SHA1 al guardar. Debe decir `19:8C:5D:7C:…`. Si sale otra huella no continúes.

### 2. Cambios en el repo (yo, en build mode)

En `codemagic.yaml`, workflow `capacitor_android_release`:

```yaml
android_signing:
  - hanging360_keystore_original   # antes: hanging360_keystore_v2
```

Y añadir, justo después de "Verify keystore is available":

```yaml
- name: Verify keystore fingerprint
  script: |
    EXPECTED="19:8C:5D:7C:08:5A:7E:BD:54:BE:22:E1:9D:E9:72:65:6E:02:DD:E0"
    ACTUAL=$(keytool -list -v -keystore "$CM_KEYSTORE_PATH" \
      -storepass "$CM_KEYSTORE_PASSWORD" -alias "$CM_KEY_ALIAS" \
      | grep -i "SHA1:" | head -n1 | awk '{print $2}')
    echo "Expected: $EXPECTED"
    echo "Actual:   $ACTUAL"
    [ "$ACTUAL" = "$EXPECTED" ] || { echo "Fingerprint mismatch — Play rechazará el AAB"; exit 1; }
```

Esto hace que si alguna vez alguien vuelve a adjuntar el keystore equivocado, el build falle en 5 segundos con un mensaje claro en vez de tras 15 minutos de compilación.

### 3. Confirmación pendiente sobre `applicationId`

La versión 3 publicada en Play, ¿tiene `applicationId` `com.hanging360.app` o `com.hanging360.tech`? Play empareja **huella + package name**; si el package no coincide también rechaza. El workflow actual fuerza `com.hanging360.app`. Si Play la registró con `.tech`, hay que quitar ese `sed` de reemplazo. **Míralo en Play Console → App integrity → App signing (o en el listado de la app) y confírmame.**

### 4. Higiene

- Compartiste el keystore y la contraseña en chat. Cuando termine este flujo, guarda el `.keystore` en un lugar seguro cifrado (1Password / Bitwarden), no en el repo ni en el chat.
- No borres `hanging360_keystore_v2` de Codemagic todavía — déjalo hasta confirmar que el nuevo `.aab` sube a Play sin error.

## Fuera de alcance

- No toco iOS, ni `build.gradle` (ya lee del env de Codemagic), ni versiones, ni el flujo web.

## Qué necesito antes de darle a build

1. "Subido a Codemagic como `hanging360_keystore_original`, SHA1 muestra `19:8C:…`" ✓
2. `applicationId` real en Play (`.app` o `.tech`) ✓
