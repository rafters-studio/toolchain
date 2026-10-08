# toolchain

One toolchain for every rafters-studio TypeScript repo: a shared pnpm catalog delivered as a config dependency, BDD tooling (Gherkin feature generation and a Cucumber.js preset), and a reusable CI workflow.

## Use it

Run `toolchain init` at the workspace root. Running it again changes nothing. It:

- adds `@rafters/toolchain` to `configDependencies` in `pnpm-workspace.yaml`, and as a root devDependency through `catalog:`;
- writes `.pnpmfile.mjs`, which re-exports the toolchain's hooks;
- sets `packageManager` to the toolchain's pnpm version when the repo has none, and keeps an existing pin;
- sets the toolchain's version in `configDependencies`, the default `catalog:` block and the root devDependency, whether those entries are new or already there;
- adds `@rafters/toolchain` to `minimumReleaseAgeExclude`, keeping the rest of that list;
- reports any managed package the repo pins directly.

It handles two pnpm behaviours. A config dependency's pnpmfile is not applied on its own, and the bare package name does not resolve for a config dependency, so `.pnpmfile.mjs` re-exports from `node_modules/.pnpm-config/@rafters/toolchain/pnpmfile.mjs`:

```js
export { hooks } from "./node_modules/.pnpm-config/@rafters/toolchain/pnpmfile.mjs";
```

A config dependency does not link its bin, so the devDependency is what lets `pnpm exec toolchain drift` run.

Then write `catalog:` for `vite-plus`, `vite`, `typescript`, `zod`, `wrangler`, `@cloudflare/workers-types`, `@cucumber/cucumber`, `@rafters/release` and `@types/node`. An entry your own `pnpm-workspace.yaml` sets stays yours.

## Upgrading

Run `toolchain init` again with the newer toolchain. It moves the `@rafters/toolchain` entries to its own version and excludes the package from pnpm's release-age check, so the install that follows passes.

The top-level `catalog:` block init writes coexists with a repo's own `catalogs:` block.

`cucumber.mjs`:

```js
export { default } from "@rafters/toolchain/cucumber";
```

The `toolchain` bin:

- `toolchain features <requirement-id> <feature path>` writes a legion requirement's scenarios to a Gherkin feature file.
- `toolchain init` adopts the toolchain, as above.
- `toolchain drift` exits non-zero, naming each file and package, when a workspace `package.json` (the root and the packages `pnpm-workspace.yaml` lists) pins a managed package instead of using `catalog:`.

CI, in `.github/workflows/ci.yml`:

```yaml
jobs:
  ci:
    uses: rafters-studio/toolchain/.github/workflows/ts-ci.yml@main
    # with:
    #   migratr-rev: <commit>
```

The workflow runs `pnpm run build` only when the root `package.json` has a `build` script, and logs when it skips it.
