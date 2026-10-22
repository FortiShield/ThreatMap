import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignore: [
    "scripts/**",
    "package.json",
    "tools/create-plugin/templates/**",
    ".github/**",
    "**/typedoc.json",
    "packages/sdk/sdk-frontend/**",
    "packages/sdk/sdk-workflow/**",
    "packages/ui/tokens/src/__generated__/**",
    "packages/ui/tokens/src/vendor/**",
  ],
  workspaces: {
    "packages/sdk/sdk-client": {
      project: ["src/**/*.ts!", "tests/**/*.ts!"],
      ignore: ["src/**/__generated__/**"],
      ignoreDependencies: ["@threatmap/schema-proxy"],
    },
    "packages/server/server-auth": {
      project: ["src/**/*.ts!"],
    },
    "packages/ui/primevue": {
      entry: [
        "histoire.config.ts",
        "src/**/*.story.vue",
        "src/stories/setup/**",
      ],
      project: ["src/**/*.{ts,vue,css}!"],
    },
    "packages/ui/tokens": {
      entry: ["src/index.ts"],
      project: ["src/**/*.ts!", "scripts/**/*.ts!"],
      ignore: ["src/__generated__/**", "src/vendor/**"],
    },
  },
};

export default config;
