# toolchain

## Unreleased

- `@rafters/toolchain` 0.1.0: the shared pnpm catalog (`pnpmfile.mjs`, used as a config dependency; a consumer's own entries win), the `toolchain` bin (`features` moved unchanged from platform-kit `scripts/features.mjs`, and `drift`, which fails on a managed package pinned to a version instead of `catalog:`), the Cucumber.js preset at `@rafters/toolchain/cucumber`, and the reusable `ts-ci.yml` workflow. (#1)
