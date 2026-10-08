import { fileURLToPath } from "node:url";

// Run from source (this repo) the tag check is a .ts file; from the built package it is a .mjs.
const ext = import.meta.url.endsWith(".ts") ? "ts" : "mjs";
const criterionTag = fileURLToPath(new URL(`./criterion-tag.${ext}`, import.meta.url));

/** The Cucumber.js preset: re-export it from a repo's cucumber.mjs. */
export default {
  paths: ["tests/**/*.feature", "packages/*/tests/**/*.feature"],
  import: [criterionTag, "tests/**/*.steps.ts", "packages/*/tests/**/*.steps.ts"],
  strict: true,
};
