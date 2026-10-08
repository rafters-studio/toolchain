import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findDrift } from "./drift.ts";

const NAME = "@rafters/toolchain";
const PNPMFILE = `export { hooks } from "./node_modules/.pnpm-config/${NAME}/pnpmfile.mjs";\n`;

/** The pnpm version written to a repo that has no `packageManager` pin. */
const PNPM_VERSION = "12.9.1";

export interface ToolchainPackage {
  version: string;
}

/** The text with `line` added as the first entry under the top-level `key:` block, creating the block when absent. */
function addToBlock(text: string, key: string, line: string): string {
  const lines = text.split("\n");
  const at = lines.findIndex((l) => new RegExp(`^${key}\\s*:\\s*$`).test(l));
  if (at === -1) {
    const body = text === "" || text.endsWith("\n") ? text : `${text}\n`;
    return `${body}${text === "" ? "" : "\n"}${key}:\n${line}\n`;
  }
  lines.splice(at + 1, 0, line);
  return lines.join("\n");
}

const ENTRY = /^\s+["']?@rafters\/toolchain["']?\s*:/;
const ITEM = /^\s+-\s+["']?@rafters\/toolchain["']?\s*$/;

/**
 * The text with `line` as the toolchain's entry under the top-level `key:` block: an existing
 * entry (matched by `is`) is replaced in place, otherwise `line` is added as the first entry.
 */
function setEntry(text: string, key: string, line: string, is: RegExp): string {
  const lines = text.split("\n");
  const at = lines.findIndex((l) => new RegExp(`^${key}\\s*:\\s*$`).test(l));
  if (at === -1) return addToBlock(text, key, line);
  for (let i = at + 1; i < lines.length && !/^\S/.test(lines[i] ?? ""); i++) {
    if (is.test(lines[i] ?? "")) {
      lines[i] = line;
      return lines.join("\n");
    }
  }
  return addToBlock(text, key, line);
}

function writeIfChanged(path: string, next: string): boolean {
  const prev = existsSync(path) ? readFileSync(path, "utf8") : undefined;
  if (prev === next) return false;
  writeFileSync(path, next);
  return true;
}

/**
 * Makes the workspace at `root` a toolchain consumer. Safe to run again: a file already in the
 * wanted state is not rewritten. Returns one line per file changed, then one per managed package
 * the repo still pins directly.
 */
export function init(root: string, self: ToolchainPackage): string[] {
  const report: string[] = [];

  const workspacePath = join(root, "pnpm-workspace.yaml");
  let workspace = existsSync(workspacePath) ? readFileSync(workspacePath, "utf8") : "";
  workspace = setEntry(workspace, "configDependencies", `  "${NAME}": ${self.version}`, ENTRY);
  // `catalog:` in package.json needs an entry to resolve; the shared catalog does not carry the
  // toolchain itself, so the consumer's own catalog does.
  workspace = setEntry(workspace, "catalog", `  "${NAME}": ^${self.version}`, ENTRY);
  // The old lockfile entry for the toolchain is younger than the repo's release-age rule on upgrade.
  workspace = setEntry(workspace, "minimumReleaseAgeExclude", `  - "${NAME}"`, ITEM);
  if (writeIfChanged(workspacePath, workspace)) report.push("pnpm-workspace.yaml: updated");

  const pnpmfilePath = join(root, ".pnpmfile.mjs");
  if (!existsSync(pnpmfilePath)) {
    writeFileSync(pnpmfilePath, PNPMFILE);
    report.push(".pnpmfile.mjs: written");
  } else if (!readFileSync(pnpmfilePath, "utf8").includes(`.pnpm-config/${NAME}/pnpmfile.mjs`)) {
    report.push(".pnpmfile.mjs: exists without the toolchain hooks, left as is; re-export hooks");
  }

  const manifestPath = join(root, "package.json");
  const manifest: Record<string, unknown> = JSON.parse(readFileSync(manifestPath, "utf8"));
  const dev: Record<string, unknown> =
    typeof manifest.devDependencies === "object" && manifest.devDependencies !== null
      ? { ...manifest.devDependencies }
      : {};
  dev[NAME] = "catalog:";
  manifest.devDependencies = Object.fromEntries(
    Object.entries(dev).sort(([a], [b]) => a.localeCompare(b)),
  );
  if (typeof manifest.packageManager !== "string" || manifest.packageManager === "") {
    manifest.packageManager = `pnpm@${PNPM_VERSION}`;
  }
  if (writeIfChanged(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)) {
    report.push("package.json: updated");
  }

  for (const d of findDrift(root)) {
    report.push(`${d.file}: ${d.package} is pinned to ${d.spec}, use catalog:`);
  }
  return report;
}
