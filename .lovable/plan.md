## Objetivo
Empaquetar los 5 sonidos subidos (`message.mp3`, `whatsapp.mp3`, `appointment.mp3`, `payment.mp3`, `update.mp3`) para que estén disponibles tanto en el web app (via `public/sounds/`) como en el shell nativo Capacitor (Android + iOS).

## Cambios

1. **Web app / puente de audio** — copiar los 5 mp3 a `public/sounds/`
   - `public/sounds/message.mp3`
   - `public/sounds/whatsapp.mp3`
   - `public/sounds/appointment.mp3`
   - `public/sounds/payment.mp3`
   - `public/sounds/update.mp3`
   
   Sirven para el botón "Probar sonido" en la web y para reproducirse dentro del WebView vía `new Audio("/sounds/<name>.mp3")`.

2. **Android — canales de notificación**
   - Copiar los 5 mp3 a `android/app/src/main/res/raw/` (mismos nombres, minúsculas, sin espacios — ya coinciden con los `soundAndroid` de `src/config/notificationChannels.ts`).
   - Con esto, cuando FCM envíe `channel_id: hanging360_payment` (etc.), el sistema reproducirá el sonido custom incluso con la app cerrada.
   - No hace falta tocar `MainActivity.java`: los canales se crean vía el puente `HANGING360_REGISTER_CHANNELS` y ya leen `soundAndroid` del catálogo.

3. **iOS — sonidos APNs**
   - iOS exige formato `.caf` (Core Audio Format) empaquetado en el bundle para que suenen con la app cerrada. Convertir los 5 mp3 a caf con `afconvert`/`ffmpeg`:
     - `message.caf`, `whatsapp.caf`, `appointment.caf`, `payment.caf`, `update.caf`
   - Copiarlos a `ios/App/App/` (junto a `Info.plist`) y añadir los 5 archivos al target Xcode "Copy Bundle Resources". Como Codemagic compila con `xcodebuild`, hay que registrarlos en `ios/App/App.xcodeproj/project.pbxproj` en `PBXBuildFile` + `PBXResourcesBuildPhase` para que se copien en el .ipa.
   - Los nombres ya coinciden con `soundIOS` del catálogo (`message.caf`, etc.).

4. **Verificación**
   - `NOTIFICATIONS_SETUP.md` ya documenta esta estructura; no requiere cambios.
   - Tras el merge: `git pull && npx cap sync && codemagic build`.

## Detalles técnicos

- Los mp3 originales no se suben como Lovable Assets porque Android/iOS necesitan los binarios reales dentro del bundle nativo (no una URL CDN).
- `public/sounds/` sí se sirve por Vite y por el web app remoto; puede referenciarse desde el iframe con `HTMLAudioElement`.
- Para la conversión iOS usaré `ffmpeg -i x.mp3 -c:a pcm_s16le -ar 44100 x.caf` (formato IMA4/PCM aceptado por APNs). Duración recomendada ≤ 30s.
- Edición del `project.pbxproj`: añadir 5 entradas `PBXFileReference` (lastKnownFileType `file.caf`), 5 `PBXBuildFile` con `fileRef`, incluir los 5 `PBXBuildFile` UUIDs en la `PBXResourcesBuildPhase` del target `App`, y agregar los 5 `PBXFileReference` al grupo `App`.

## Fuera de alcance
- Cambios en el web app remoto (`tech.hanging360.com`) — ya lo cubre el otro proyecto.
- Cambios en el catálogo `notificationChannels.ts` (los nombres ya matchean).
