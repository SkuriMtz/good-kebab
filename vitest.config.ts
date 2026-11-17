import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Las pruebas se corren desde la raíz del proyecto (npm test)
const raiz = process.cwd();

export default defineConfig({
  resolve: {
    alias: {
      // Igual que "paths" de tsconfig.json
      "@/": `${resolve(raiz, "src")}/`,
      // "server-only" truena a propósito fuera de Next: en pruebas es un módulo vacío
      "server-only": resolve(raiz, "tests/vacio.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
