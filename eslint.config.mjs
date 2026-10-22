import { defaultConfig } from "@threatmap/eslint-config";

export default [
  ...defaultConfig({
    compat: false,
  }),
  {
    name: "Global",
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-restricted-types": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
  {
    name: "SDK Frontend",
    ignores: [
      "packages/sdk/sdk-frontend/src/index.js",
      "packages/sdk/sdk-frontend/src/types/**",
    ],
  },
  {
    name: "QuickJS",
    ignores: [
      "packages/sdk/quickjs-types/src/llrt/**",
      "packages/sdk/quickjs-types/src/extra/**",
    ],
  },
  {
    name: "SDK Client",
    ignores: [
      "packages/sdk/sdk-client/src/transport/**/__generated__/**",
      "packages/sdk/sdk-client/src/rest/__generated__/**",
    ],
  },
  {
    name: "PrimeVue Theme Presets",
    files: ["packages/ui/primevue/src/classic/**"],
    rules: {
      eqeqeq: "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
    },
  },
  {
    name: "PrimeVue Stories",
    files: ["packages/ui/primevue/src/stories/**"],
    languageOptions: {
      globals: {
        console: "readonly",
      },
    },
    rules: {
      "vue/define-props-destructuring": "off",
    },
  },
];
