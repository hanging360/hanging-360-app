## Objetivo
Automatizar `npx cap sync` (iOS + Android) en cada push a `main` de GitHub, para que no tengas que correrlo localmente. El "git pull" no aplica en CI (el workflow ya clona el repo), pero el efecto es el mismo: cada cambio que Lovable sube a GitHub queda sincronizado con las carpetas nativas automáticamente.

## Qué se creará

**Un solo archivo nuevo:** `.github/workflows/cap-sync.yml`

Este workflow:
1. Se dispara en cada `push` a `main` que toque `capacitor.config.ts`, `package.json`, `package-lock.json`, `src/**`, `public/**`, `ios/**` o `android/**` (y también manualmente con "Run workflow").
2. Instala Node 20 + dependencias con `npm ci`.
3. Corre `npm run build`.
4. Corre `npx cap sync ios` y `npx cap sync android`.
5. Si los directorios `ios/` o `android/` cambian, hace commit automático de vuelta a `main` con mensaje `chore: cap sync [skip ci]` (usa `stefanzweifel/git-auto-commit-action`).

## Flujo resultante

```text
Lovable edita código → push a main
        ↓
GitHub Action: npm ci → build → npx cap sync
        ↓
Si ios/ o android/ cambian → commit automático a main
        ↓
Codemagic detecta el push y compila IPA/AAB con los nativos ya sincronizados
```

## Requisitos / permisos

- El workflow necesita `permissions: contents: write` para poder commitear (ya incluido en el YAML).
- No requiere secretos adicionales; usa el `GITHUB_TOKEN` que GitHub inyecta.
- Si tienes protección de rama en `main` que bloquea pushes directos, hay que permitir al bot de Actions o cambiar el destino a una rama `cap-sync/*` + PR automático (dímelo y ajusto el plan).

## Fuera de alcance
- No modifica `codemagic.yaml`, ni el shell nativo, ni la PWA.
- No corre en cada commit de Codemagic — Codemagic seguirá compilando como hoy, solo que sobre carpetas nativas ya sincronizadas.

¿Apruebas para implementarlo?
