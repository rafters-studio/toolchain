# toolchain

One toolchain for every rafters-studio TypeScript repo: a shared pnpm catalog delivered as a config dependency, BDD tooling (Gherkin feature generation and a Cucumber.js preset), and a reusable CI workflow.

## Use it

`pnpm-workspace.yaml`:

```yaml
catalogMode: strict
configDependencies:
  "@rafters/toolchain": 0.1.0
```

`.pnpmfile.mjs`:

```js
export { hooks } from "@rafters/toolchain/pnpmfile.mjs";
```

Then write `catalog:` for `vite-plus`, `vite`, `typescript`, `zod`, `wrangler`, `@cloudflare/workers-types`, `@cucumber/cucumber` and `@types/node`. An entry your own `pnpm-workspace.yaml` sets stays yours.

`cucumber.mjs`:

```js
export { default } from "@rafters/toolchain/cucumber";
```

The `toolchain` bin:

- `toolchain features <requirement-id> <feature path>` writes a legion requirement's scenarios to a Gherkin feature file.
- `toolchain drift` exits non-zero, naming each file and package, when a workspace `package.json` (the root and the packages `pnpm-workspace.yaml` lists) pins a managed package instead of using `catalog:`.

CI, in `.github/workflows/ci.yml`:

```yaml
jobs:
  ci:
    uses: rafters-studio/toolchain/.github/workflows/ts-ci.yml@main
    # with:
    #   migratr-rev: <commit>
```
