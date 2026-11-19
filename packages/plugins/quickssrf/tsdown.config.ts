import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "./src/index.ts",
    "ui/index": "./src/ui/index.ts",
    "backend/index": "./backend/src/index.ts",
    "frontend/index": "./frontend/src/index.ts",
  },
  platform: "node",
  format: "esm",
  dts: true,
  sourcemap: true,
  clean: true,
  deps: {
    neverBundle: [
      "zod",
      "@threatmap/sdk-shared",
      "@threatmap/sdk-frontend",
      "@threatmap/sdk-backend",
      "vue",
      "primevue",
    ],
  },
});
