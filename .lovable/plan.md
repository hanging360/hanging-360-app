## Problema
El paso "Build web app" falla en el runner macOS de Codemagic con:
`Cannot find module @rollup/rollup-darwin-arm64`

Es el bug conocido de npm con dependencias opcionales (npm/cli#4828): el `package-lock.json` fue generado en otra plataforma (Linux) y npm omite el binario nativo de Rollup para darwin-arm64.

## Solución
Modificar el paso **"Install JS dependencies"** en `codemagic.yaml` en **ambos workflows** (`capacitor_ios_release` y `capacitor_android_release`) para eliminar `package-lock.json` y `node_modules` antes de `npm install`, forzando la resolución nativa por plataforma:

```yaml
- name: Install JS dependencies
  script: |
    rm -rf node_modules package-lock.json
    npm install --no-audit --no-fund --legacy-peer-deps
```

Esto garantiza que en macOS se descargue `@rollup/rollup-darwin-arm64` y en Linux `@rollup/rollup-linux-x64-gnu`, evitando el crash de Rollup en `vite build`.

## Fuera de alcance
No se cambian versiones de Rollup/Vite ni el `package.json` del proyecto.

## Resultado esperado
`npm run build` completa en ambos workflows y las compilaciones siguen hasta generar el `.ipa` (iOS) y el `.aab` (Android).