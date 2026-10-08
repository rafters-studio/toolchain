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

export const hooks = {
  // The consumer's own default-catalog entries win over the toolchain's.
  updateConfig(config) {
    const catalogs = config.catalogs ?? {};
    return { ...config, catalogs: { ...catalogs, default: { ...catalog, ...catalogs.default } } };
  },
};
