import { defaultValue, t, fs, semver, util } from './common';
import { Manifest } from './manifest';

const { stripSlashes } = util;
const DEFAULT = {
  FILE: 'ssr.yml',
};
const ERROR = {
  noFile: (path: string) => `An "${DEFAULT.FILE}" configuration file does not exist at: ${path}`,
};

/**
 * A parser for the `ssr.yml` configuration file.
 */
export class Config {
  /**
   * [Lifecycle]
   */
  public static create = async (options: { path?: string } = {}) => {
    const path = fs.resolve(options.path || DEFAULT.FILE);
    if (!(await fs.pathExists(path))) {
      throw new Error(ERROR.noFile(path));
    } else {
      const def = await fs.file.loadAndParse<t.ISsrConfig>(path);
      return new Config({ def });
    }
  };

  public static createSync = (options: { path?: string } = {}) => {
    const path = fs.resolve(options.path || DEFAULT.FILE);
    if (!fs.pathExistsSync(path)) {
      throw new Error(`An "ssr.yml" configuration file does not exist at: ${path}`);
    } else {
      const def = fs.file.loadAndParseSync<t.ISsrConfig>(path);
      return new Config({ def });
    }
  };

  private constructor(args: { def: t.ISsrConfig }) {
    this.def = args.def;
  }

  /**
   * [Fields]
   */
  private readonly def: t.ISsrConfig;

  /**
   * [Properties]
   */
  public get secret() {
    return toValue(this.def.secret);
  }

  public get builder() {
    const builder = this.def.builder || {};
    builder.bundles = builder.bundles || 'bundles';
    builder.entries = builder.entries || '';
    return builder;
  }

  public get s3() {
    const s3 = this.def.s3 || {};
    const path = s3.path || {};

    const endpoint = util.stripHttp(s3.endpoint || '');
    const cdn = util.stripHttp(s3.cdn || '');
    const accessKey = toValue(s3.accessKey);
    const secret = toValue(s3.secret);
    const bucket = s3.bucket || '';

    const api = {
      endpoint,
      cdn,
      accessKey,
      secret,
      bucket,
      path: {
        base: stripSlashes(path.base || ''),
        manifest: stripSlashes(path.manifest || ''),
        bundles: stripSlashes(path.bundles || ''),
      },
      get config(): t.IS3Config {
        return { endpoint, accessKey, secret };
      },
      get fs() {
        return fs.s3(api.config);
      },
      async versions(options: { sort?: 'ASC' | 'DESC' } = {}) {
        const s3 = api.fs;
        const prefix = `${api.path.base}/${api.path.bundles}`;
        const list = s3.list({
          bucket,
          prefix,
        });

        const dirs = (await list.dirs).items.map(({ key }) => ({ key, version: fs.basename(key) }));
        const versions = semver.sort(dirs.map(item => item.version));
        return options.sort === 'DESC' ? versions.reverse() : versions;
      },
    };

    return api;
  }

  public get baseUrl() {
    const s3 = this.s3;
    return `https://${s3.cdn || s3.endpoint}/${s3.path.base}`;
  }

  public get manifest() {
    // Manifest file.
    const filePath = fs.resolve(this.def.manifest || 'manifest.yml');

    // Manifest URL.
    const s3 = this.s3;
    const manifestUrl = `https://${s3.endpoint}/${s3.bucket}/${s3.path.base}/${s3.path.manifest}`;
    const baseUrl = this.baseUrl;

    const config = this; // eslint-disable-line
    const api = {
      local: {
        path: filePath,
        get exists() {
          return fs.pathExists(filePath);
        },
        async load(args: { loadBundleManifest?: boolean } = {}) {
          const { loadBundleManifest } = args;
          return Manifest.fromFile({ path: filePath, baseUrl, loadBundleManifest });
        },
        async ensureLatest(args: { minimal?: boolean } = {}) {
          // Ensure local exists.
          if (!(await api.local.exists)) {
            await config.createFromTemplate();
          }

          // Overwrite with latest cloud content (if it exists).
          const remote = await api.s3.pull({ force: true });
          if (remote.ok) {
            const minimal = defaultValue(args.minimal, true);
            await remote.save(filePath, { minimal });
          }

          // Load the manifest.
          return api.local.load();
        },
      },
      s3: {
        url: manifestUrl,
        async pull(args: { force?: boolean; loadBundleManifest?: boolean } = {}) {
          return Manifest.get({ ...args, manifestUrl, baseUrl });
        },
      },
    };

    return api;
  }

  /**
   * [Methods]
   */
  public async createFromTemplate() {
    const source = fs.join(__dirname, '../tmpl/manifest.yml');
    const target = this.manifest.local.path;
    await fs.ensureDir(fs.dirname(target));
    await fs.copy(source, target);
    return { source, target };
  }
}

/**
 * [Helpers]
 */
const toValue = (value?: string) => {
  value = value || '';
  value = process.env[value] ? process.env[value] : value;
  return value || '';
};
