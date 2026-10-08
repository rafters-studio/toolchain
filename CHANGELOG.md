# toolchain

## 0.1.2

- `toolchain init` adopts the toolchain in a repo with one command. (#9)
- `ts-ci.yml` skips the build when a repo has no build script. (#9)
- `@rafters/release` is in the shared catalog. (#9)

## 0.1.1

- `toolchain drift` checks only the workspace's own packages, with exclusions that match pnpm's `package.json` path forms. (#3)
- `toolchain drift` also fails a root `package.json` that pins pnpm through `devEngines.packageManager`, which makes npm 11 fail every command with EBADDEVENGINES; the error says to use `"packageManager": "pnpm@<version>"`. This repo makes that switch. (#5)

## 0.1.0

- `@rafters/toolchain` 0.1.0: the shared pnpm catalog (`pnpmfile.mjs`, used as a config dependency; a consumer's own entries win), the `toolchain` bin (`features` moved unchanged from platform-kit `scripts/features.mjs`, and `drift`, which fails on a managed package pinned to a version instead of `catalog:`), the Cucumber.js preset at `@rafters/toolchain/cucumber`, and the reusable `ts-ci.yml` workflow. (#1)
