import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { findDrift } from "../src/drift.ts";

const bin = fileURLToPath(new URL("../bin/toolchain.mjs", import.meta.url));

// Built at run time: a checked-in package.json that pins a managed package would fail this repo's own drift check.
function workspace(manifests: Record<string, object>): string {
  const root = mkdtempSync(join(tmpdir(), "toolchain-drift-"));
  for (const [path, manifest] of Object.entries(manifests)) {
    mkdirSync(join(root, path), { recursive: true });
    writeFileSync(join(root, path, "package.json"), JSON.stringify(manifest));
  }
  return root;
}

const clean = () =>
  workspace({
    ".": {
      dependencies: { zod: "catalog:", "left-pad": "^1.3.0" },
      devDependencies: { typescript: "catalog:" },
      peerDependencies: { zod: "catalog:peers" },
    },
  });

const pinned = () =>
  workspace({
    ".": { devDependencies: { typescript: "catalog:" } },
    "packages/app": { dependencies: { zod: "^4.0.0" }, devDependencies: { "vite-plus": "1.0.0" } },
  });

describe("toolchain drift", () => {
  it("passes a workspace that uses catalog: for every managed package", () => {
    const root = clean();
    expect(findDrift(root)).toEqual([]);
    expect(spawnSync("node", [bin, "drift"], { cwd: root }).status).toBe(0);
  });

  it("names each file and package that pins a managed package", () => {
    expect(findDrift(pinned())).toEqual([
      { file: "packages/app/package.json", package: "zod", spec: "^4.0.0" },
      { file: "packages/app/package.json", package: "vite-plus", spec: "1.0.0" },
    ]);
  });

  it("exits non-zero and prints the file and package", () => {
    const result = spawnSync("node", [bin, "drift"], { cwd: pinned(), encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("packages/app/package.json: zod");
  });

  it("passes this repo", () => {
    expect(findDrift(fileURLToPath(new URL("..", import.meta.url)))).toEqual([]);
  });
});
