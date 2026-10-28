export interface Config {
  catalogs?: Record<string, Record<string, string>>;
  [key: string]: unknown;
}

export interface PackageManifest {
  name?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export const catalog: Readonly<Record<string, string>>;

export const catalogs: Readonly<Record<string, Readonly<Record<string, string>>>>;

export const astroCheckTypescript: string;

export const hooks: {
  updateConfig(config: Config): Config;
  readPackage(pkg: PackageManifest): PackageManifest;
};
