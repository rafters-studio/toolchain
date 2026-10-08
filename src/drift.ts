import { existsSync, globSync, readFileSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";
import { catalog } from "../pnpmfile.mjs";

const SECTIONS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];

export interface Drift {
  file: string;
  package: string;
  spec: string;
}

/** The `package` of a Drift entry for a pnpm pin in `devEngines.packageManager` rather than a dependency. */
export const DEV_ENGINES_PIN = "devEngines.packageManager";

/** True when `devEngines.packageManager` (one entry or a list) names pnpm. */
function devEnginesNamesPnpm(manifest: Record<string, unknown>): boolean {
  const engines = manifest.devEngines;
  if (typeof engines !== "object" || engines === null || !("packageManager" in engines)) {
    return false;
  }
  const pins = Array.isArray(engines.packageManager)
    ? engines.packageManager
    : [engines.packageManager];
  return pins.some(
    (pin) => typeof pin === "object" && pin !== null && "name" in pin && pin.name === "pnpm",
  );
}

/** The `packages:` globs of pnpm-workspace.yaml; an absent file or key means no workspace packages. */
function workspaceGlobs(root: string): string[] {
  let text: string;
  try {
    text = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
  } catch {
    return [];
  }
  const globs: string[] = [];
  let inPackages = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^packages\s*:/.test(line)) {
      inPackages = true;
    } else if (/^\S/.test(line)) {
      inPackages = false;
    } else if (inPackages) {
      const item = /^\s*-\s*(?:"([^"]*)"|'([^']*)'|([^#\s][^#]*?))\s*(?:#.*)?$/.exec(line);
      const glob = item?.[1] ?? item?.[2] ?? item?.[3];
      if (glob) globs.push(glob);
    }
  }
  return globs;
}

const clean = (glob: string) => glob.replace(/^\.\//, "").replace(/\/+$/, "");

/** The root package.json plus every package the workspace globs match, `!` patterns excluding as pnpm does. */
function packageJsonFiles(root: string): string[] {
  const globs = workspaceGlobs(root);
  const excluded = globs.filter((g) => g.startsWith("!")).map((g) => clean(g.slice(1)));
  const files = new Set([join(root, "package.json")]);
  for (const glob of globs.filter((g) => !g.startsWith("!"))) {
    for (const dir of globSync(clean(glob), { cwd: root })) {
      const rel = dir.split(sep).join("/");
      if (rel.split("/").includes("node_modules")) continue;
      if (
        excluded.some(
          (e) => posix.matchesGlob(rel, e) || posix.matchesGlob(`${rel}/package.json`, e),
        )
      )
        continue;
      const file = join(root, dir, "package.json");
      if (existsSync(file)) files.add(file);
    }
  }
  return [...files];
}

/** Every managed package a package.json in the workspace pins to something other than `catalog:`, and a root pnpm pin in `devEngines`, which breaks npm 11. */
export function findDrift(root: string): Drift[] {
  const drift: Drift[] = [];
  for (const path of packageJsonFiles(root).sort()) {
    const manifest: Record<string, unknown> = JSON.parse(readFileSync(path, "utf8"));
    if (path === join(root, "package.json") && devEnginesNamesPnpm(manifest)) {
      drift.push({ file: relative(root, path), package: DEV_ENGINES_PIN, spec: "pnpm" });
    }
    for (const section of SECTIONS) {
      const deps = manifest[section];
      if (typeof deps !== "object" || deps === null) continue;
      for (const [name, spec] of Object.entries(deps)) {
        if (name in catalog && typeof spec === "string" && !spec.startsWith("catalog:")) {
          drift.push({ file: relative(root, path), package: name, spec });
        }
      }
    }
  }
  return drift;
}
