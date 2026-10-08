import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
// @ts-expect-error -- plain ESM script with no type declarations
import { renderFeature as platformKitRender } from "./fixtures/features-reference.mjs";
import { renderFeature, writeFeature, type RequirementRow } from "../src/features.ts";

const row: RequirementRow = JSON.parse(
  readFileSync(new URL("./fixtures/requirement.fixture.json", import.meta.url), "utf8"),
);

describe("toolchain features", () => {
  it("renders the same bytes as platform-kit's generator", () => {
    expect(renderFeature(row)).toBe(platformKitRender(row));
  });

  it("writes those bytes to the feature path, creating its directory", () => {
    const path = join(mkdtempSync(join(tmpdir(), "toolchain-")), "a", "b.feature");
    writeFeature(row.id, path, () => row);
    expect(readFileSync(path, "utf8")).toBe(platformKitRender(row));
  });

  it("refuses a requirement with no scenarios", () => {
    expect(() => renderFeature({ id: "X", updated_at: "t", payload: { title: "T" } })).toThrow();
  });
});
