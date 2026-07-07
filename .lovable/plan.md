## Plan

I’ll treat this as a stale or publish-only Rollup resolution failure, because the visible error is truncated and points at Vite/Rollup `resolveId` rather than a TypeScript/runtime error.

### Steps

1. **Reproduce the failure locally**
   - Run the exact build scripts used by publishing: `build` and `build:dev`.
   - Capture the full stderr output so the missing import/package name is visible, not just the Rollup stack tail.

2. **Check for unresolved import sources**
   - Scan the app source, Vite config, package files, and native/Capacitor adapter paths for imports that publishing may fail to resolve.
   - Pay special attention to prior suspects: `@vitejs/plugin-react`, `@capacitor/core`, native Capacitor plugin packages, path aliases, and stale generated output.

3. **Patch the smallest build-blocking cause**
   - If the failure is a stale config/package mismatch, align `package.json`, lockfile, and `vite.config.ts`.
   - If it is a native Capacitor import leaking into the web bundle, keep native access behind the existing browser-safe adapter.
   - If publishing is reading stale generated artifacts, remove or stop relying on generated `dist`/`www` output in the source tree.

4. **Verify before reporting fixed**
   - Run both `bun run build` and `bun run build:dev` successfully.
   - Confirm the source no longer contains web-bundled imports that Rollup cannot resolve.

### Expected outcome

Publishing should no longer fail during Vite/Rollup module resolution, and the build output should progress beyond the current “10 modules transformed” failure point.

<presentation-actions><presentation-open-history>View History</presentation-open-history></presentation-actions>

<presentation-actions><presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link></presentation-actions>