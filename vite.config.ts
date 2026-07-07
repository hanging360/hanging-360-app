import { defineConfig } from "vite";

const preserveRollupErrorContext = () => ({
  name: "preserve-rollup-error-context",
  buildEnd(error?: Error) {
    if (!error) return;

    const rollupError = error as Error & {
      code?: string;
      id?: string;
      plugin?: string;
      frame?: string;
    };

    const details = [
      "Rollup build error context:",
      rollupError.code ? `code: ${rollupError.code}` : undefined,
      rollupError.plugin ? `plugin: ${rollupError.plugin}` : undefined,
      rollupError.id ? `file: ${rollupError.id}` : undefined,
      rollupError.message,
      rollupError.frame,
    ].filter(Boolean);

    console.error(details.join("\n"));
  },
});

export default defineConfig({
  plugins: [preserveRollupErrorContext()],
  build: {
    sourcemap: false,
  },
});
