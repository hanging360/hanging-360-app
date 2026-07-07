## Plan

1. Replace the Vite React plugin that depends on SWC native bindings:
   - Change `@vitejs/plugin-react-swc` to `@vitejs/plugin-react` in `package.json`.
   - Update `vite.config.ts` to import `@vitejs/plugin-react` instead of the SWC plugin.

2. Refresh the dependency lockfile/install state:
   - Run `bun install` so `bun.lock` reflects the plugin change and removes the SWC-native dependency path.

3. Verify the publishing build path:
   - Run the project build script (`bun run build`) to confirm Vite can load config and complete without `@swc/core` native binding errors.

## Why this fixes it

The publish build fails before compiling the app because `vite.config.ts` imports `@vitejs/plugin-react-swc`, which loads `@swc/core`. That package requires a platform-specific native binary, and the publish environment is failing to load it. Switching to the standard Vite React plugin avoids SWC native bindings while keeping React/Vite behavior intact.