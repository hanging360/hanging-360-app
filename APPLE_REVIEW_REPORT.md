# Apple App Review — Guideline 4 Fix Report

App: **Hanging360** (Capacitor iOS) — build 0.3 (14)
Rechazo original: *"controls that are difficult to use due to size or placement"*

## Arquitectura

Este repositorio es un **shell nativo Capacitor**. Carga el portal remoto
`https://tech.hanging360.com/my-appointment` dentro de un `<iframe>`. Toda la
UI de negocio (headers, bottom nav, formularios, modales, tap targets) vive
en el proyecto Lovable del portal client, **no aquí**.

Por eso este fix cubre solo el shell. El checklist para el portal remoto va
al final de este documento y debe aplicarse en su proyecto Lovable
correspondiente antes de reenviar a Apple.

## Cambios en este repo (shell)

| Archivo | Cambio |
|---|---|
| `src/index.css` | `.webview-iframe` respeta `env(safe-area-inset-*)` en los 4 lados con `box-sizing: border-box`. `.home-screen` añade safe-area padding. `.role-btn` fuerza `min-width/min-height: 44px`. Media query iPad (`min-width:768px`) centra el iframe con `max-width:820px`. |
| `src/components/AppShell.tsx` | En iOS ya **no** se llama `StatusBar.hide()` ni `setOverlaysWebView({overlay:true})`. La status bar iOS queda visible y el iframe respeta el safe area. En Android se mantiene el modo inmersivo existente. |
| `src/lib/capacitorPlugins.ts` | Nuevo helper `getPlatform()` para diferenciar iOS / Android / web. |
| `src/screens/HomeScreen.tsx` | El logo (link a WhatsApp) se envuelve en un `<a>` con `min-width:44 / min-height:44` y `aria-label`. |

## Configuración iOS verificada (sin cambios necesarios)

- `index.html` → `viewport-fit=cover` ya estaba presente.
- `ios/App/App.xcodeproj/project.pbxproj` → `TARGETED_DEVICE_FAMILY = "1,2"` (iPhone + iPad).
- `ios/App/App/Info.plist` → `UISupportedInterfaceOrientations~ipad` completo (portrait + landscape).
- `ios/App/App/Base.lproj/LaunchScreen.storyboard` → intacto, usa el splash regenerado sin cuadrado blanco (fix anterior).

## Rutas / viewports auditados en el shell

- iPhone SE (320×568), iPhone estándar (375×667), iPhone Pro (390×844), Pro Max (430×932): la `HomeScreen` nativa y el `AppShell` iframe respetan safe areas y no producen overflow horizontal.
- iPad (768, 820, 1024): iframe centrado en 820px, sin estiramiento hostil.

## Lo que **no** cambió (regresión protegida)

RBAC, RLS, auth, appointments, technician assignment, finance, payments,
inventory, MCP, Cerebro, WhatsApp, AI agents, Supabase Edge Functions,
push notifications, splash screen assets.

## Instrucciones para el usuario

1. `git pull`
2. `npm install` (si aplica)
3. `npm run build`
4. `npx cap sync ios`
5. Recompilar en Xcode, subir nuevo build, y **también aplicar el checklist B en el proyecto del portal** antes de reenviar a Apple.

---

## Riesgos remanentes

**Los controles que Apple rechazó viven mayoritariamente en el portal
remoto.** Sin aplicar el checklist B abajo, es probable que Apple vuelva a
rechazar la app aunque este shell esté correcto.

---

# Checklist B — Portal client (`tech.hanging360.com`)

Aplicar en el proyecto Lovable del portal client
(candidatos: **Hanging360 Tech 1** o **app-hanging360-web**; confirmar cuál
es el que sirve `tech.hanging360.com`).

### B1. Componente/utility de tap target
Crear `<TapTarget>` o clase Tailwind `min-h-11 min-w-11 inline-flex items-center justify-center`.
El ícono visible puede ser 20/24px; el wrapper garantiza 44×44.

### B2. Buscar y arreglar patrones sospechosos
```
rg -n "h-[6-8]|w-[6-8]|size-[6-8]|p-[01]\b" src \
  | rg -i "button|onclick|role=\"button\"|Trigger|Close"
```
Envolver o subir a `min-h-11 min-w-11`.

### B3. Safe areas
- Headers: `pt-[env(safe-area-inset-top)]`.
- Bottom nav / FAB: `pb-[max(env(safe-area-inset-bottom),12px)]`.
- Sheets/modales: acciones primarias con `pb-[env(safe-area-inset-bottom)]`.

### B4. Bottom navigation
Cada item ≥44×44, gap ≥8px, labels ≥11px, no overlap con home indicator.

### B5. Headers
Back / close / menu / notif / profile → hit area 44×44, ≥8px del edge + safe area.

### B6. Formularios
Inputs `h-11` mínimo. Selects, date/time pickers 44px. Submit siempre visible con teclado.

### B7. Modales / Sheets / Dialogs
Close 44×44 en esquina dentro de safe area. CTAs primarias sobre home indicator.

### B8. Responsive
Auditar 320/375/390/414/430 (iPhone) y 768/820/1024 (iPad). Sin overflow horizontal.

### B9. Regresión
No tocar: RBAC, RLS, auth, appointments, technician assignment, finanzas, pagos, inventario, MCP, Cerebro, WhatsApp, AI agents, edge functions.

### B10. Verificación
`tsgo` / lint / `vite build` + route-audit por rol.

---

## Notas de tests

El repo shell no tiene tests unitarios para UI (es un WebView wrapper).
La verificación es visual + build limpio.