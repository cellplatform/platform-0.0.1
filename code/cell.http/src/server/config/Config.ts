import { t, fs, R, value as valueUtil, ERROR } from '../../common';

export const DEFAULT: t.IHttpConfigDeployment = {
  name: 'Untitled',
  collection: 'cell.data',
  fs: {
    endpoint: '',
    root: '',
  },
  now: {
    deployment: '',
    domain: '',
    subdomain: undefined,
  },
  secret: {
    mongo: '',
    s3: { key: '', secret: '' },
  },
};

export class Config {
  public static DEFAULT = DEFAULT;

  /**
   * Loads the configuration.
   */
  public static loadSync(args: t.IHttpConfigFileArgs = {}) {
    // Path.
    const path = args.path ? fs.resolve(args.path) : fs.resolve('config.yml');
    const dir = fs.dirname(path);
    const filename = fs
      .basename(path)
      .trim()
      .replace(/\.yml$/, '')
      .replace(/\.yaml$/, '')
      .trim();

    const ext =
      ['yml', 'yaml'].find((ext) => {
        return fs.pathExistsSync(fs.join(dir, `${filename}.${ext}`));
      }) || '';
    const file = fs.join(dir, `${filename}.${ext}`);

    const exists = fs.pathExistsSync(file);
    if (!exists && args.throw) {
      throw new Error(`Config file does not exist: ${path}`);
    }

    // Load file.
    let data = DEFAULT;
    if (exists) {
      const yaml = fs.file.loadAndParseSync<t.IHttpConfigDeployment>(file, DEFAULT);
      data = R.mergeDeepRight(data, yaml);
      data.now = data.now || {};
      data.secret = data.secret || {};
      data.secret.mongo = data.secret.mongo ? `@${data.secret.mongo.replace(/^\@/, '')}` : ''; // Prepend "@" symbol for `zeit/now`.
    }

    const config: t.IHttpConfigFile = {
      path: exists ? file : path,
      exists,
      data,
      validate: () => validate(config),
    };

    // Finish up.
    return config;
  }
}

/**
 * [Helpers]
 */

function validate(config: t.IHttpConfigFile) {
  const data = config.data;
  const res: t.IHttpConfigValidation = {
    errors: [],
    get isValid() {
      return res.errors.length === 0;
    },
  };

  const error = (message: string) => {
    const error: t.IError = { type: ERROR.HTTP.CONFIG, message };
    res.errors.push(error);
    return res;
  };

  if (!config.exists) {
    return error(`Configuration file does not exist.`);
  }

  if (!(data.name || '').trim()) {
    error('Missing [name] value.');
  }

  const fs = data.fs || {};
  ['endpoint', 'root'].forEach((field) => {
    const value = trim(fs[field]);
    if (isEmpty(value)) {
      error(`Missing [fs.${field}] value.`);
    }
  });

  const now = data.now || {};
  ['deployment', 'domain'].forEach((field) => {
    const value = trim(now[field]);
    if (isEmpty(value)) {
      error(`Missing [now.${field}] value.`);
    }
  });

  const secret = data.secret || {};
  ['mongo', 's3'].forEach((field) => {
    const value = trim(secret[field]);
    if (isEmpty(value)) {
      error(`Missing [secret.${field}] value.`);
    }
  });

  return res;
}

const isEmpty = (value: any) => {
  if (typeof value === 'object') {
    const keys = Object.keys(valueUtil.deleteEmpty({ ...value }));
    return keys.length === 0;
  } else {
    return !Boolean(value);
  }
};

const trim = (value: any) => {
  return typeof value === 'string' ? value.trim() : value;
};
