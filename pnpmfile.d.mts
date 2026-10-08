export interface Config {
  catalogs?: Record<string, Record<string, string>>;
  [key: string]: unknown;
}

export const catalog: Readonly<Record<string, string>>;

export const hooks: {
  updateConfig(config: Config): Config;
};
