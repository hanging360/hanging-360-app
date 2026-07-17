## Diagnóstico

El error de Gradle:

```
Failed to read key hanging360-key ... Get Key failed: Given final block not properly padded.
```

Esto **no es un bug del código** — es literalmente Java diciendo *"la contraseña de la key es incorrecta"*. El store abrió bien (si el store password fuera malo, el error sería otro). Lo que falla es el **Key password** que introdujiste al subir el keystore a Codemagic.

Cuando creé el keystore lo verifiqué con `keytool -list -v` usando `-storepass @Cr043079`, y eso solo prueba el store password. El key password puede ser distinto y solo se detecta al firmar.

## Qué tienes que hacer tú en Codemagic (yo no puedo tocar esto)

Codemagic → **Teams → Code signing identities → Android keystores → `hanging360_keystore_original` → Edit**:

- **Keystore password:** `@Cr043079` ✓ (ya está bien)
- **Key alias:** `hanging360-key` ✓
- **Key password:** ← aquí está el problema. Prueba en este orden:
  1. `@Cr043079` (misma que el store)
  2. `hanging360`
  3. La que originalmente usaste al crear el keystore hace años

Guarda y relanza el workflow. No necesito cambiar nada en el repo.

## Si no recuerdas el key password

Se puede recuperar/cambiar localmente sin perder la firma (la firma depende de la **private key**, no del password que la protege):

```bash
# 1. Intenta abrir la key con distintos passwords
keytool -keypasswd -keystore hanging360-release-key.keystore \
  -alias hanging360-key -storepass @Cr043079

# Te pedirá el key password actual. Si aciertas, te deja poner uno nuevo.
# Pon el nuevo igual al store (@Cr043079) para que sea uno solo y no vuelva a pasar.
```

Después re-subes el `.keystore` a Codemagic con el key password nuevo. La SHA1 sigue siendo la misma `19:8C:5D:…`, así que Play lo acepta.

## Sanity check preventivo (esto sí lo agrego yo cuando me pases a build)

Añadir al workflow, justo después del check de fingerprint, un **test de firma en frío** que falla en 3 segundos si el key password está mal, en vez de esperar a que Gradle compile 4 minutos:

```yaml
- name: Verify key password
  script: |
    keytool -keypasswd -keystore "$CM_KEYSTORE_PATH" \
      -storepass "$CM_KEYSTORE_PASSWORD" \
      -alias "$CM_KEY_ALIAS" \
      -keypass "$CM_KEY_PASSWORD" \
      -new "$CM_KEY_PASSWORD" 2>&1 | tee /tmp/kp.log
    if grep -qi "password was incorrect\|not properly padded\|Get Key failed" /tmp/kp.log; then
      echo "ERROR: CM_KEY_PASSWORD no coincide con el key password real del alias"
      exit 1
    fi
```

(`-new` igual al actual = no cambia nada, solo valida.)

## Fuera de alcance

No toco iOS, ni `build.gradle`, ni versiones, ni el flujo web. Nada del código está mal — el problema es 100% el key password guardado en Codemagic.

## Qué necesito para pasar a build

Una de dos:

- **(a)** Confirmas que corregiste el Key password en Codemagic y quieres que agregue el paso de verificación preventivo, **o**
- **(b)** Me dices que no recuerdas el key password y prefieres cambiarlo con el comando `keytool -keypasswd` de arriba antes de re-subirlo.
