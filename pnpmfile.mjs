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

// The TypeScript `astro check` runs on. @astrojs/check resolves `typescript` from its own location and
// drives TypeScript's programmatic API, which the native compiler (7.0 and later) does not ship. Its
// peer would resolve to the consumer's catalog TypeScript, so readPackage turns that peer into a
// dependency of its own, and the rest of the repo stays on the catalog's version.
export const astroCheckTypescript = "^6.0.3";

export const hooks = {
  // The consumer's own default-catalog entries win over the toolchain's.
  updateConfig(config) {
    const catalogs = config.catalogs ?? {};
    return { ...config, catalogs: { ...catalogs, default: { ...catalog, ...catalogs.default } } };
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
