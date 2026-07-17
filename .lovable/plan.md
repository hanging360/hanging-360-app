## Problema
`npx cap sync android` falla con:
`The Capacitor CLI requires NodeJS >=22.0.0`

El workflow `capacitor_android_release` en `codemagic.yaml` fija `node: 20`, pero la versión actual de Capacitor CLI requiere Node 22+.

## Solución
Actualizar la versión de Node en `codemagic.yaml`:

- En `capacitor_android_release` → `environment.node`: cambiar `20` → `22`.
- En `capacitor_ios_release` no hay clave `node` explícita (usa la default del runner macOS), pero para evitar el mismo error añadir `node: 22` en su bloque `environment`.

No se toca Java (21), ni el keystore, ni el resto de scripts.

## Fuera de alcance
- No cambiar versiones de Capacitor, Vite, Rollup ni `package.json`.
- No modificar la lógica de firma ni los triggers.

## Resultado esperado
`npx cap sync android` (y `ios`) se ejecuta con Node 22 y el workflow continúa hasta generar el `.aab` firmado.
