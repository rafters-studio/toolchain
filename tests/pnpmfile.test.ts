import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { catalog, hooks } from "../pnpmfile.mjs";

const pnpmfile = fileURLToPath(new URL("../pnpmfile.mjs", import.meta.url));

describe("pnpmfile updateConfig", () => {
  it("adds the managed packages as the default catalog", () => {
    expect(hooks.updateConfig({}).catalogs).toEqual({ default: catalog });
    expect(Object.keys(catalog).sort()).toEqual([
      "@cloudflare/workers-types",
      "@cucumber/cucumber",
      "@rafters/release",
      "@types/node",
      "typescript",
      "vite",
      "vite-plus",
      "wrangler",
      "zod",
    ]);
  });

  it("keeps an entry the consumer set, and other catalogs", () => {
    const config = hooks.updateConfig({
      catalogs: { default: { zod: "^3.0.0" }, peers: { zod: ">=3" } },
    });
    expect(config.catalogs?.default?.zod).toBe("^3.0.0");
    expect(config.catalogs?.default?.typescript).toBe(catalog.typescript);
    expect(config.catalogs?.peers).toEqual({ zod: ">=3" });
  });

  it("matches this repo's own catalog", () => {
    const yaml = readFileSync(new URL("../pnpm-workspace.yaml", import.meta.url), "utf8");
    for (const [name, version] of Object.entries(catalog)) {
      expect(yaml).toMatch(
        new RegExp(`^  "?${name}"?: "?${version.replace(/[.^]/g, "\\$&")}"?$`, "m"),
      );
    }
  });
});

describe("pnpm install in a fixture workspace", () => {
  it("resolves catalog: to the toolchain's version and keeps the fixture's own", () => {
    const dir = mkdtempSync(join(tmpdir(), "toolchain-ws-"));
    cpSync(fileURLToPath(new URL("./fixtures/workspace", import.meta.url)), dir, {
      recursive: true,
    });
    writeFileSync(
      join(dir, ".pnpmfile.mjs"),
      `export { hooks } from ${JSON.stringify(pnpmfile)};\n`,
    );
    execFileSync("pnpm", ["install", "--lockfile-only"], { cwd: dir, stdio: "pipe" });

    const lock = readFileSync(join(dir, "pnpm-lock.yaml"), "utf8");
    expect(lock).toMatch(/zod:\n\s+specifier: \^4\.6\.5\n/);
    expect(lock).toMatch(/'@types\/node':\n\s+specifier: \^22\n/);
  }, 120_000);
});
