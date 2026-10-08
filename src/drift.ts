import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { catalog } from "../pnpmfile.mjs";

const SECTIONS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
const SKIPPED_DIRS = new Set(["node_modules", ".git", "dist"]);

export interface Drift {
  file: string;
  package: string;
  spec: string;
}

function packageJsonFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !SKIPPED_DIRS.has(entry.name)) {
      found.push(...packageJsonFiles(join(dir, entry.name)));
    } else if (entry.isFile() && entry.name === "package.json") {
      found.push(join(dir, entry.name));
    }
  }
  return found;
}

/** Every managed package a package.json in the workspace pins to something other than `catalog:`. */
export function findDrift(root: string): Drift[] {
  const drift: Drift[] = [];
  for (const path of packageJsonFiles(root).sort()) {
    const manifest: Record<string, unknown> = JSON.parse(readFileSync(path, "utf8"));
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
