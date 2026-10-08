import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    cache: true,
  },
  pack: {
    entry: {
      cli: "src/cli.ts",
      cucumber: "src/cucumber.ts",
      "criterion-tag": "src/criterion-tag.ts",
    },
    dts: {
      generator: "tsgo",
    },
    exports: false,
  },
});
