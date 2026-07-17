## Problema

Google Play rechaza el `.aab` con "All uploaded bundles must be signed." El bloque `android_signing: [hanging360_keystore_v2]` de Codemagic pone el keystore disponible en el runner y expone las variables `CM_KEYSTORE_PATH / CM_KEYSTORE_PASSWORD / CM_KEY_ALIAS / CM_KEY_PASSWORD`, pero **no** modifica `build.gradle`. Como `android/app/build.gradle` no tiene `signingConfigs.release` ni `buildTypes.release.signingConfig`, Gradle produce:

- `app-release.aab` sin firmar (lo que Play rechaza)
- `app-release-unsigned.apk` (por eso también salía "unsigned")

## Solución

Editar únicamente `android/app/build.gradle` para leer el keystore desde las variables de entorno de Codemagic y aplicarlo al build type `release`.

```gradle
android {
    namespace = "com.hanging360.tech"
    compileSdk = rootProject.ext.compileSdkVersion
    defaultConfig { ... }

    signingConfigs {
        release {
            def ksPath = System.getenv("CM_KEYSTORE_PATH")
            if (ksPath) {
                storeFile file(ksPath)
                storePassword System.getenv("CM_KEYSTORE_PASSWORD")
                keyAlias      System.getenv("CM_KEY_ALIAS")
                keyPassword   System.getenv("CM_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            if (System.getenv("CM_KEYSTORE_PATH")) {
                signingConfig signingConfigs.release
            }
        }
    }
}
```

Y añadir un paso de verificación en `codemagic.yaml` (workflow `capacitor_android_release`) justo antes de `Build signed AAB + APK`, para fallar temprano si el keystore no está montado:

```yaml
- name: Verify keystore is available
  script: |
    if [ -z "$CM_KEYSTORE_PATH" ] || [ ! -f "$CM_KEYSTORE_PATH" ]; then
      echo "ERROR: CM_KEYSTORE_PATH not set — hanging360_keystore_v2 no adjunto al workflow"
      exit 1
    fi
    echo "Keystore OK en $CM_KEYSTORE_PATH (alias=$CM_KEY_ALIAS)"
```

Y añadir una comprobación post-build que confirme que el `.aab` está firmado (si no lo está, aborta el workflow para no subir un artefacto malo):

```yaml
- name: Verify AAB is signed
  script: |
    AAB=$(ls android/app/build/outputs/bundle/release/*.aab | head -n1)
    unzip -p "$AAB" META-INF/MANIFEST.MF > /dev/null || (echo "AAB corrupto" && exit 1)
    if ! unzip -l "$AAB" | grep -Eq "META-INF/.*\.(RSA|EC|DSA)"; then
      echo "ERROR: AAB SIN FIRMAR"
      exit 1
    fi
    echo "AAB firmado correctamente."
```

## Fuera de alcance

- No se cambia el keystore, `applicationId`, versiones, ni el flujo iOS.
- No se toca `package.json` ni Capacitor.

## Resultado esperado

En el próximo run del workflow Android:

- `android/app/build/outputs/bundle/release/app-release.aab` firmado con `hanging360_keystore_v2` → aceptado por Play Console.
- `android/app/build/outputs/apk/release/app-release.apk` (ya sin sufijo `-unsigned`) firmado con el mismo keystore.
- Si por cualquier motivo el keystore no está adjunto al workflow, el build falla en el paso de verificación en vez de generar un `.aab` inválido.
