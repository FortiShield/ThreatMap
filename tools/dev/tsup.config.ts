import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    cli: "./src/cli.ts",
  },
  format: ["esm"],
  target: "node22.5.0",
  clean: true,
});
