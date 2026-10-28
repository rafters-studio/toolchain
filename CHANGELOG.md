# toolchain

## 0.1.5

- TypeScript 6 is a standard version beside 7 until TypeScript 7 ships its programmatic API. `catalog:` gives 7. A package that drives the compiler API writes `"typescript": "catalog:ts6"` and gets 6 in the same workspace, so no repo-wide override is needed. `astro check` uses the same `ts6` version. (#26)

## 0.1.4

- `astro check` runs alongside the catalog's TypeScript 7: the `readPackage` hook gives `@astrojs/check` its own TypeScript 6 in place of its `typescript` peer, so a repo needs no `typescript` override of its own. After upgrading, run `pnpm install` once to regenerate the lockfile. (#22)
- The README gives the `astro sync && astro-check` script for Astro 7.4 and later, whose `astro check` command refuses TypeScript 7 before the hook can help, and the tsconfig change TypeScript 7 requires: no `baseUrl`, and `paths` starting with `./`. (#22)

## 0.1.3

- `toolchain init`'s integration test installs a published toolchain version, so it no longer needs its own version published first. (#13)
- `toolchain init` keeps the repo's pnpm pin, upgrades an existing toolchain pin, and excludes the toolchain from the release-age check. (#15)

## 0.1.2

- `toolchain init` adopts the toolchain in a repo with one command. (#9)
- `ts-ci.yml` skips the build when a repo has no build script. (#9)
- `@rafters/release` is in the shared catalog. (#9)

## 0.1.1

- `toolchain drift` checks only the workspace's own packages, with exclusions that match pnpm's `package.json` path forms. (#3)
- `toolchain drift` also fails a root `package.json` that pins pnpm through `devEngines.packageManager`, which makes npm 11 fail every command with EBADDEVENGINES; the error says to use `"packageManager": "pnpm@<version>"`. This repo makes that switch. (#5)

## 0.1.0

- `@rafters/toolchain` 0.1.0: the shared pnpm catalog (`pnpmfile.mjs`, used as a config dependency; a consumer's own entries win), the `toolchain` bin (`features` moved unchanged from platform-kit `scripts/features.mjs`, and `drift`, which fails on a managed package pinned to a version instead of `catalog:`), the Cucumber.js preset at `@rafters/toolchain/cucumber`, and the reusable `ts-ci.yml` workflow. (#1)
