import { findDrift } from "./drift.ts";
import { writeFeature } from "./features.ts";

const USAGE = `usage:
  toolchain features <requirement-id> <feature path>
  toolchain drift`;

function main(argv: string[]): number {
  const [command, ...args] = argv;
  if (command === "features") {
    const [id, path] = args;
    if (!id || !path) {
      console.error(USAGE);
      return 2;
    }
    writeFeature(id, path);
    return 0;
  }
  if (command === "drift") {
    const drift = findDrift(process.cwd());
    for (const d of drift) {
      console.error(`${d.file}: ${d.package} is pinned to ${d.spec}, use catalog:`);
    }
    return drift.length === 0 ? 0 : 1;
  }
  console.error(USAGE);
  return 2;
}

process.exitCode = main(process.argv.slice(2));
