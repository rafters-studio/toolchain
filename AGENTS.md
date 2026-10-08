# toolchain

`@rafters/toolchain`: the one dev dependency through which every rafters-studio TypeScript repo gets its tool versions, its BDD tooling and its CI. A repo picks up a toolchain change by bumping one version. Owned by the platform agent.

If you are part of a legion team, orient through legion before reading anything here:

```
legion whoami --repo toolchain         # who owns this repo
legion whatami --repo toolchain        # how toolchain works
legion recall --repo toolchain         # what toolchain remembers about the task at hand
legion sym ...                         # code questions: definitions, references
```

Toolchain: Vite+ (`vp`). Run `vp install` after pulling, and `vp check` and `vp test` before committing.

## Layout

- `pnpmfile.mjs`: the shipped catalog and its `updateConfig` hook. The catalog also lives in this repo's `pnpm-workspace.yaml`, because the repo cannot read its own config dependency; `tests/pnpmfile.test.ts` keeps the two equal. Change a version in both.
- `src/cli.ts`: the `toolchain` bin (`features`, `drift`, `init`). `bin/toolchain.mjs` runs the built `dist/cli.mjs`, or `src/cli.ts` before the first build (CI runs `toolchain drift` ahead of the build).
- `src/init.ts`: `toolchain init`, which makes a workspace a consumer.
- `src/cucumber.ts`: the Cucumber.js preset, exported as `@rafters/toolchain/cucumber`.
- `.github/workflows/ts-ci.yml`: the reusable CI workflow. This repo's `ci.yml` calls it.

## Drift fixtures

Never check in a `package.json` that pins a managed package: `toolchain drift` scans this repo too. Tests build such workspaces in a temp directory.

## Releasing

The first publish is by hand, so npm trusted publishing can be configured. After that, a pushed `v*` tag publishes through `.github/workflows/release.yml`.
