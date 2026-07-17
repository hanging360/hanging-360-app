## Diagnóstico (verificado)

Verifiqué el keystore que subiste (`hanging360-release-key-3.keystore`) con `keytool` + `jarsigner`. Las credenciales correctas son:

| Campo | Valor |
|---|---|
| **Keystore file** | `hanging360-release-key-3.keystore` (el que acabas de subir) |
| **Keystore password** | `@Cr043079` |
| **Key alias** | `hanging360-key` |
| **Key password** | `@Cr043079` ← el mismo que el store |
| **SHA1** | `19:8C:5D:7C:08:5A:7E:BD:54:BE:22:E1:9D:E9:72:65:6E:02:DD:E0` ✅ coincide con Play |

Confirmé que firma correctamente un JAR de prueba (`jar signed.`), así que este keystore SÍ produce un AAB aceptado por Google Play.

El problema con `hanging360_keystore_v2` en Codemagic es que apunta a un keystore distinto (SHA1 `0B:B8:1A…`), por eso Play lo rechaza.

## Qué necesitas hacer en Codemagic (yo no puedo tocarlo)

Codemagic → **Teams → Code signing identities → Android keystores → Add keystore** (o edita el existente):

1. **Upload keystore file:** sube `hanging360-release-key-3.keystore` (el archivo que acabas de subirme aquí; te lo puedo dejar disponible en el repo o lo descargas de tu propio upload).
2. **Reference name:** `hanging360_keystore_original`
3. **Keystore password:** `@Cr043079`
4. **Key alias:** `hanging360-key`
5. **Key password:** `@Cr043079`

Guarda.

## Qué cambio yo en el repo (build mode)

Solo `codemagic.yaml`:

- Cambiar `android_signing: [hanging360_keystore_v2]` → `[hanging360_keystore_original]`.
- Dejar el paso "Verify keystore fingerprint" (ya comprueba SHA1 `19:8C:…`) — así si te equivocas subiendo el archivo, el build falla en 5 segundos con mensaje claro en vez de a los 4 minutos.
- Dejar el paso "Verify key password" (jarsigner de prueba) — valida las 3 credenciales antes de compilar.

Un solo commit, ~2 líneas cambiadas. Nada de código de la app se toca.

## Fuera de alcance

No toco iOS, ni `build.gradle`, ni versiones, ni web. El keystore subido es el bueno; el trabajo es re-cablearlo en Codemagic + apuntar el yaml a la nueva referencia.

## Qué necesito de ti para pasar a build

Confirma:
- **(a)** Ya subiste el keystore a Codemagic con reference name `hanging360_keystore_original` y los valores de la tabla de arriba → hago el cambio en `codemagic.yaml` y lanzas build. **O**
- **(b)** Prefieres otro reference name (dímelo) y lo uso en el yaml.
