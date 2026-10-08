// Writes a legion requirement's verification.scenarios to a Gherkin feature file.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

interface Scenario {
  gherkin: string;
}

interface RequirementPayload {
  title?: string;
  verification?: { scenarios?: Scenario[] };
}

export interface RequirementRow {
  id: string;
  updated_at: string;
  payload: string | RequirementPayload;
}

/**
 * Renders the feature file text for one `legion document view <id> --json` row.
 * The same row always renders the same bytes.
 */
export function renderFeature(row: RequirementRow): string {
  const payload: RequirementPayload =
    typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
  const scenarios = payload?.verification?.scenarios;
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    throw new Error(`${row.id} has no verification.scenarios`);
  }
  const header = [
    `# Generated from legion requirement ${row.id}, revision ${row.updated_at}.`,
    "# Do not edit: regenerate with scripts/features.mjs.",
  ];
  const blocks = scenarios.map((scenario) => scenario.gherkin.trim().replace(/^/gm, "  "));
  return `${header.join("\n")}\n\nFeature: ${payload.title}\n\n${blocks.join("\n\n")}\n`;
}

function viewWithLegion(id: string): RequirementRow {
  const json = execFileSync("legion", ["document", "view", id, "--json"], { encoding: "utf8" });
  return JSON.parse(json);
}

export function writeFeature(
  id: string,
  path: string,
  view: (id: string) => RequirementRow = viewWithLegion,
): void {
  const text = renderFeature(view(id));
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}
