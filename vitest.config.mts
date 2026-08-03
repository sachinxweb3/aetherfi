import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

// Lightweight test harness. Node environment only (pure logic, no DOM yet).
// The "@/..." alias mirrors tsconfig so tests import modules the same way the app does.
// Scoped to top-level specs so the harness owns only the seed suites it created.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
})
