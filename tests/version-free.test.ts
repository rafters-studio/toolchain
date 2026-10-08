import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";

const root = fileURLToPath(new URL("..", import.meta.url));

// The init tests must pass whatever version package.json carries: a release PR bumps it to a
// version that is not published yet. Run them in a copy of the repo that carries one.
describe("init tests", () => {
  it("pass when package.json carries an unpublished version", () => {
    const copy = mkdtempSync(join(tmpdir(), "toolchain-unpublished-"));
    for (const path of [
      "bin",
      "src",
      ".github",
      "package.json",
      "pnpmfile.mjs",
      "pnpmfile.d.mts",
      "pnpm-workspace.yaml",
      "tsconfig.json",
      "vite.config.ts",
    ]) {
      cpSync(join(root, path), join(copy, path), { recursive: true });
    }
    cpSync(join(root, "tests/init.test.ts"), join(copy, "tests/init.test.ts"));
    symlinkSync(join(root, "node_modules"), join(copy, "node_modules"));
    const manifest = JSON.parse(readFileSync(join(copy, "package.json"), "utf8"));
    manifest.version = "999.0.0";
    writeFileSync(join(copy, "package.json"), JSON.stringify(manifest));
    expect(() =>
      execFileSync(join(root, "node_modules/.bin/vp"), ["test", "run", "tests/init.test.ts"], {
        cwd: copy,
        stdio: "pipe",
      }),
    ).not.toThrow();
  }, 180_000);
});
