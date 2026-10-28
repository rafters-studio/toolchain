import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { astroCheckTypescript, catalog, catalogs, hooks } from "../pnpmfile.mjs";

const pnpmfile = fileURLToPath(new URL("../pnpmfile.mjs", import.meta.url));

describe("pnpmfile updateConfig", () => {
  it("adds the managed packages as the default catalog, and ts6 as a named one", () => {
    expect(hooks.updateConfig({}).catalogs).toEqual({ default: catalog, ...catalogs });
    expect(catalogs.ts6?.typescript).toMatch(/^\^6\./);
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

  it("keeps a consumer's own ts6 entry over the toolchain's", () => {
    const config = hooks.updateConfig({ catalogs: { ts6: { typescript: "6.0.0" } } });
    expect(config.catalogs?.ts6?.typescript).toBe("6.0.0");
    expect(config.catalogs?.default?.typescript).toBe(catalog.typescript);
  });

  it("gives astro check the same TypeScript as catalog:ts6", () => {
    expect(astroCheckTypescript).toBe(catalogs.ts6?.typescript);
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

describe("pnpmfile readPackage", () => {
  it("gives @astrojs/check its own typescript in place of the peer", () => {
    const pkg = hooks.readPackage({
      name: "@astrojs/check",
      dependencies: { kleur: "^4.1.5" },
      peerDependencies: { typescript: "^5.0.0 || ^6.0.0" },
    });
    expect(pkg.dependencies).toEqual({ kleur: "^4.1.5", typescript: astroCheckTypescript });
    expect(pkg.peerDependencies).toEqual({});
  });

  it("leaves every other package alone", () => {
    const manifest = { name: "tsconfck", peerDependencies: { typescript: "^5.0.0" } };
    expect(hooks.readPackage(manifest)).toBe(manifest);
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
    // The workspace stays on the catalog's typescript; astro check gets its own.
    const major = (range: string) => range.replace(/^\D*/, "").split(".")[0];
    expect(lock).toMatch(
      new RegExp(
        ` typescript:\n\\s+specifier: 'catalog:'\n\\s+version: ${major(catalog.typescript)}\\.`,
      ),
    );
    // A package that opts in with catalog:ts6 gets TypeScript 6 in the same workspace.
    expect(lock).toMatch(
      new RegExp(
        `packages/api-user:\\n\\s+devDependencies:\\n\\s+typescript:\\n\\s+specifier: '?catalog:ts6'?\\n\\s+version: ${major(catalogs.ts6?.typescript ?? "")}\\.`,
      ),
    );
    expect(lock).toMatch(
      new RegExp(
        `'@astrojs/check@[^']+':\n\\s+dependencies:\n(?:\\s+.+\n)*?\\s+typescript: ${major(astroCheckTypescript)}\\.`,
      ),
    );
  }, 120_000);
});
