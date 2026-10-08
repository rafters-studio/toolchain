#!/usr/bin/env node
// Published installs run the built CLI. A checkout that has not built yet (this repo's own CI runs
// `toolchain drift` before the build) runs the TypeScript source through Node's type stripping.
import { existsSync } from "node:fs";

const built = new URL("../dist/cli.mjs", import.meta.url);
const source = new URL("../src/cli.ts", import.meta.url);
await import(existsSync(built) ? built.href : source.href);
