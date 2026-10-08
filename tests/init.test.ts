import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";

const bin = fileURLToPath(new URL("../bin/toolchain.mjs", import.meta.url));
const own = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

function fixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "toolchain-init-"));
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name: "fresh", private: true, dependencies: { zod: "catalog:" } }),
  );
  return dir;
}

const init = (cwd: string) => execFileSync("node", [bin, "init"], { cwd, encoding: "utf8" });
const files = (dir: string) =>
  [".pnpmfile.mjs", "package.json", "pnpm-workspace.yaml"].map((f) =>
    readFileSync(join(dir, f), "utf8"),
  );

describe("toolchain init", () => {
  it("makes a fresh workspace a consumer and changes nothing the second time", () => {
    const dir = fixture();
    init(dir);
    const first = files(dir);
    const manifest = JSON.parse(first[1]);
    expect(manifest.devDependencies["@rafters/toolchain"]).toBe("catalog:");
    expect(manifest.packageManager).toBe(own.packageManager);
    expect(first[0]).toContain(".pnpm-config/@rafters/toolchain/pnpmfile.mjs");
    expect(first[2]).toContain(`configDependencies:\n  "@rafters/toolchain": ${own.version}`);
    expect(init(dir)).toBe("");
    expect(files(dir)).toEqual(first);
  });

  it("yields a workspace where pnpm install applies the catalog and drift runs", () => {
    const dir = fixture();
    init(dir);
    // pnpm fetches config dependencies from the registry, so install a version
    // that exists on npm rather than this repo's own, possibly unpublished, one.
    const published = execFileSync("pnpm", ["view", "@rafters/toolchain", "version"], {
      cwd: dir,
      encoding: "utf8",
    }).trim();
    const workspace = join(dir, "pnpm-workspace.yaml");
    writeFileSync(
      workspace,
      readFileSync(workspace, "utf8")
        .replace(`"@rafters/toolchain": ${own.version}`, `"@rafters/toolchain": ${published}`)
        .replace(`"@rafters/toolchain": ^${own.version}`, `"@rafters/toolchain": ^${published}`),
    );
    execFileSync("pnpm", ["install"], { cwd: dir, stdio: "pipe" });
    expect(readFileSync(join(dir, "pnpm-lock.yaml"), "utf8")).toMatch(
      /zod:\n\s+specifier: \^4\.6\.5\n/,
    );
    execFileSync("pnpm", ["exec", "toolchain", "drift"], { cwd: dir, stdio: "pipe" });
    expect(init(dir)).toBe("");
  }, 120_000);

  it("keeps the repo's existing workspace entries", () => {
    const dir = fixture();
    writeFileSync(
      join(dir, "pnpm-workspace.yaml"),
      "catalogMode: strict\nconfigDependencies:\n  other: 1.0.0\ncatalog:\n  left-pad: ^1\n",
    );
    init(dir);
    const yaml = readFileSync(join(dir, "pnpm-workspace.yaml"), "utf8");
    expect(yaml).toContain("  other: 1.0.0");
    expect(yaml).toContain("  left-pad: ^1");
    expect(yaml).toContain('"@rafters/toolchain"');
    const again = files(dir);
    init(dir);
    expect(files(dir)).toEqual(again);
  });

  it("reports a managed package the repo pins directly", () => {
    const dir = fixture();
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "p", devDependencies: { typescript: "^5.0.0" } }),
    );
    expect(init(dir)).toContain("package.json: typescript is pinned to ^5.0.0, use catalog:");
  });
});

describe("ts-ci.yml build step", () => {
  const workflow = readFileSync(new URL("../.github/workflows/ts-ci.yml", import.meta.url), "utf8");
  const script = /- name: Build\n\s+run: \|\n((?:\s{10}.*\n?)+)/.exec(workflow)?.[1] ?? "";

  function run(scripts: object): string {
    const dir = mkdtempSync(join(tmpdir(), "toolchain-ci-"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "ci", scripts }));
    writeFileSync(join(dir, "pnpm"), '#!/bin/sh\necho "pnpm $@"\n');
    chmodSync(join(dir, "pnpm"), 0o755);
    return execFileSync("bash", ["-e", "-c", script], {
      cwd: dir,
      encoding: "utf8",
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
    });
  }

  it("skips the build and says so when there is no build script", () => {
    expect(script).not.toBe("");
    expect(run({})).toContain("Skipping the build");
  });

  it("runs the build when there is one", () => {
    expect(run({ build: "x" })).toContain("pnpm run build");
  });
});
