## Plan

1. **Capture the complete build failure**
   - Re-run the same publish build command locally with full stderr/stdout saved so the missing part after `file:///dev-server/...` is visible.
   - Check whether the failing command is `build`, `build:dev`, or both.

2. **Inspect the likely build inputs**
   - Review `package.json`, `vite.config.ts`, and the source file/import path named in the full Rollup error.
   - Confirm the previous SWC-to-Babel React plugin change is reflected consistently in dependencies and config.

3. **Fix the root cause, not the symptom**
   - If Rollup reports an unresolved import, correct the import path, alias, missing file, or missing dependency.
   - If Vite config is the issue, adjust the plugin/config to avoid the failing resolution path.
   - If the lockfile/dependency graph is stale, refresh dependencies only as needed.

4. **Verify the publish build**
   - Run the exact failing build command again.
   - Confirm the build exits successfully before reporting the fix.

5. **If the error is still environment-only**
   - Capture and compare the local build output with the publish error.
   - Provide the precise remaining blocker and next recovery path, including History rollback if needed.