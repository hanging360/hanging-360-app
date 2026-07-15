
# Fix Apple Guideline 4 — Hanging360 Capacitor + Client Portal

## Contexto importante (leer primero)

Este repo (`app-hanging360` en Lovable) es un **shell nativo Capacitor muy delgado**. Su único trabajo es:

- Cargar `https://tech.hanging360.com/my-appointment` dentro de un `<iframe>` (`src/components/AppShell.tsx`).
- Gestionar splash, status bar, push notifications y modo inmersivo.

**El 90% de los controles que Apple rechazó (botones, headers, formularios, modales, bottom nav) vive en el portal remoto `tech.hanging360.com`, NO en este repo.** Ese portal es otro proyecto Lovable (probablemente [Hanging360 Tech 1](/projects/cc2d221c-88bb-4d51-8d99-c63c4b57a5d5) o similar). Los cambios de UI de tap targets hay que hacerlos allí y republicarlo — desde este proyecto solo puedo **leer** ese otro repo, no editarlo.

Por eso el plan tiene dos partes: (A) lo que arreglo aquí, (B) el checklist accionable para llevar al proyecto del portal.

---

## Parte A — Cambios en este repo (shell Capacitor)

### A1. Safe-areas del iframe y del loading
Archivo: `src/index.css` + `src/components/AppShell.tsx`
- Hoy el iframe ocupa `inset:0` a pantalla completa, ignorando notch, Dynamic Island y home indicator. Apple lo marca como controles pegados al borde.
- Cambiar `.webview-screen` / `.webview-iframe` para respetar `env(safe-area-inset-*)` en iOS. El fondo (`background:#000` o el color de marca) se extiende hasta el borde, pero el iframe navegable queda dentro del safe-area.
- Añadir en `index.html` el meta `viewport-fit=cover` (verificar; si falta, agregarlo).

### A2. Modo inmersivo Android no aplica en iOS
- Hoy `AppShell` llama `StatusBar.hide()` y `setOverlaysWebView({overlay:true})` en todas las plataformas. En iOS esto empuja el contenido del portal debajo del Dynamic Island/notch.
- Cambiar a: en **iOS**, no ocultar status bar; usar `setStyle` claro/oscuro y dejar la status bar visible. Inmersivo solo Android.

### A3. HomeScreen nativa (`src/screens/HomeScreen.tsx`)
Es la pantalla que Apple sí ve en el arranque nativo. Auditar:
- `.role-btn` mide 76px de ancho pero sólo ~76px de alto — verificar que el hit-area sea ≥44×44 (padding suficiente).
- El logo `.home-logo` es un enlace a WhatsApp: envolver en un botón con área ≥44×44.
- El card `.home-card` tiene `padding: 5rem 3rem 6rem` que en iPhone SE (375×667) puede recortar la grilla — revisar responsive.
- Añadir `padding-top: env(safe-area-inset-top)` y `padding-bottom: max(env(safe-area-inset-bottom), 16px)` al contenedor.

### A4. Soporte iPad correcto
Archivo: `ios/App/App.xcodeproj/project.pbxproj` + Info.plist
- Verificar `TARGETED_DEVICE_FAMILY = "1,2"` (iPhone + iPad). Si está solo en 1, el usuario decidió iPhone+iPad → dejarlo en `"1,2"`.
- Asegurar en `Info.plist` las orientaciones iPad (`UISupportedInterfaceOrientations~ipad`) para todas las orientaciones, o bloquear a portrait consistentemente. Hoy la app depende de una anchura estrecha — en iPad se estira.
- En `src/index.css`, dar al `.webview-screen` un `max-width` sano en iPad (p.ej. `min(100vw, 820px)` centrado) o dejar full-width pero garantizar que el portal remoto no rompa (esto último depende de Parte B).

### A5. LaunchScreen storyboard
- Confirmar `ios/App/App/Base.lproj/LaunchScreen.storyboard` usa el Splash sin cuadrado blanco y respeta safe areas.

### A6. Reporte de shell
Producir un `APPLE_REVIEW_REPORT.md` en la raíz con:
- Archivos cambiados en el shell
- Configuración iPad final
- Confirmación de safe-areas
- Sección "Portal remoto pendiente" con el link al otro proyecto y el checklist B.

---

## Parte B — Checklist para el proyecto del portal client (`tech.hanging360.com`)

No puedo tocar ese repo desde aquí, pero al abrirlo el usuario (o un nuevo prompt en ese proyecto) debe aplicar:

### B1. Utilidad global de tap target
Crear un componente/wrapper compartido (`<TapTarget>` o clase Tailwind `min-h-11 min-w-11 inline-flex items-center justify-center`) donde el ícono visible puede quedarse en 20/24px pero el wrapper garantiza 44×44.

### B2. Search & fix de patrones sospechosos
Buscar en el portal:
- `h-6 h-7 h-8 w-6 w-7 w-8 size-6 size-7 size-8` en elementos con `onClick`, `role="button"`, `<button>`, `IconButton`, `DropdownMenuTrigger`, `SelectTrigger`, `DialogClose`, `SheetClose`.
- `p-0 p-1` en botones sin tamaño explícito.
- Envolver o subir a `min-h-11 min-w-11`.

### B3. Safe areas en el portal
- Headers: `padding-top: env(safe-area-inset-top)`.
- Bottom nav / FAB: `padding-bottom: max(env(safe-area-inset-bottom), 12px)`.
- Sheets/modales: acciones primarias con `pb-[env(safe-area-inset-bottom)]`.

### B4. Bottom navigation
- Cada item ≥44×44, `gap` ≥8px, labels legibles ≥11px.
- No overlap con home indicator.

### B5. Headers
- Back / close / menu / notif / profile → hit area 44×44, separados del edge por ≥8px + safe area.

### B6. Formularios
- Inputs `h-11` mínimo.
- Selects, date/time pickers 44px altos.
- Botones submit siempre visibles con keyboard (usar `scrollIntoView` o `visualViewport`).

### B7. Modales / Sheets / Dialogs
- Close button 44×44 en esquina, dentro de safe area.
- CTAs primarias sobre el home indicator.

### B8. Responsive breakpoints
Auditar en 320, 375, 390, 414, 430 (iPhone SE → Pro Max) y 768, 820, 1024 (iPad). Sin overflow horizontal, sin controles cortados.

### B9. Regresión
No tocar: RBAC, RLS, auth, appointments, technician assignment, finanzas, pagos, inventario, MCP, Cerebro, WhatsApp, AI agents, edge functions.

### B10. Verificación
`tsgo` / lint / `vite build` y route-audit por rol.

---

## Detalle técnico (para desarrollador)

- Archivos que edito en este repo:
  - `src/index.css` (safe-areas de `.webview-screen`, `.webview-iframe`, `.home-screen`, `.home-card`)
  - `src/components/AppShell.tsx` (StatusBar iOS vs Android, no ocultar en iOS)
  - `src/screens/HomeScreen.tsx` (hit areas ≥44×44 en `.role-btn` y logo-WhatsApp)
  - `index.html` (asegurar `viewport-fit=cover`)
  - `ios/App/App.xcodeproj/project.pbxproj` (`TARGETED_DEVICE_FAMILY = "1,2"`)
  - `ios/App/App/Info.plist` (orientaciones iPad)
  - `APPLE_REVIEW_REPORT.md` (nuevo)

- No modifico `capacitor.config.ts` a nivel funcional; sólo si el status bar iOS lo exige.
- No cambio push notifications, supabase, ni lógica de negocio.

## Qué necesito de ti antes de pasar a build

1. Confirmar cuál es el proyecto Lovable del portal client (candidatos: [Hanging360 Tech 1](/projects/cc2d221c-88bb-4d51-8d99-c63c4b57a5d5), [app-hanging360](/projects/120d1226-c9ac-4756-844c-5ae2a836e877)) para dejarlo referenciado en el reporte final.
2. Confirmar que puedo bajar el splash y ajustar la StatusBar iOS (quedará visible el reloj/batería en iOS, en Android sigue inmersivo).

Cuando apruebes, ejecuto la Parte A y entrego el reporte con el checklist B listo para llevar al otro proyecto.
