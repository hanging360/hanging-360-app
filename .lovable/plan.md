## Entregar el keystore para subir a Codemagic

Voy a dejar el archivo listo para descarga en `/mnt/documents/hanging360-release-key.keystore` (copia exacta del `hanging360-release-key-3.keystore` que ya validé).

Verificado:
- **SHA1:** `19:8C:5D:7C:08:5A:7E:BD:54:BE:22:E1:9D:E9:72:65:6E:02:DD:E0` ✅ (coincide con Play)
- **Store password:** `@Cr043079`
- **Key alias:** `hanging360-key`
- **Key password:** `@Cr043079`

## Pasos

1. Copiar `/mnt/user-uploads/hanging360-release-key-3.keystore` → `/mnt/documents/hanging360-release-key.keystore` (para que el sistema te ofrezca el link de descarga).
2. Imprimir SHA-256 del archivo para que puedas verificar integridad si quieres.

## En Codemagic (lo haces tú)

Teams → Code signing identities → Android keystores → **Add keystore**:
- File: el `.keystore` que descargues
- Reference name: `hanging360_keystore_original`
- Keystore password: `@Cr043079`
- Key alias: `hanging360-key`
- Key password: `@Cr043079`

Guarda y relanza el workflow. El yaml ya apunta a esa referencia.

## Fuera de alcance

No toco código ni configuración. Solo dejo el archivo disponible.

Aprueba para copiar el archivo.
