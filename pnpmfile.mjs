// The shared catalog every rafters-studio TypeScript repo takes its tool versions from.
// A consumer lists @rafters/toolchain under configDependencies and re-exports these hooks from its
// .pnpmfile.mjs; `catalog:` then resolves to the versions below.

export const catalog = {
  "@cloudflare/workers-types": "^5.20261004.1",
  "@cucumber/cucumber": "^12.0.0",
  "@rafters/release": "^0.1.2",
  "@types/node": "^24",
  typescript: "^7.0.2",
  vite: "npm:@voidzero-dev/vite-plus-core@1.0.0",
  "vite-plus": "1.0.0",
  wrangler: "^4.147.0",
  zod: "^4.6.5",
};

// Named catalogs. `ts6` is TypeScript 6 for packages that drive TypeScript's programmatic API, which
// the native compiler (7.0 and later) does not ship yet; a package opts in with "catalog:ts6". Both
// majors stay standard until 7 ships that API.
export const catalogs = {
  ts6: { typescript: "^6.0.3" },
};

// The TypeScript `astro check` runs on. @astrojs/check resolves `typescript` from its own location and
// drives the programmatic API, so its peer would resolve to the catalog's TypeScript 7. readPackage
// turns that peer into a dependency on the ts6 version, and the rest of the repo stays on 7.
export const astroCheckTypescript = catalogs.ts6.typescript;

export const hooks = {
  // The consumer's own entries win over the toolchain's, in the default catalog and the named ones.
  updateConfig(config) {
    const own = config.catalogs ?? {};
    const named = Object.fromEntries(
      Object.entries(catalogs).map(([name, entries]) => [name, { ...entries, ...own[name] }]),
    );
    return { ...config, catalogs: { ...own, ...named, default: { ...catalog, ...own.default } } };
  },
  readPackage(pkg) {
    if (pkg.name !== "@astrojs/check") return pkg;
    const { typescript: _peer, ...peerDependencies } = pkg.peerDependencies ?? {};
    return {
      ...pkg,
      peerDependencies,
      dependencies: { ...pkg.dependencies, typescript: astroCheckTypescript },
    };
  },
};
