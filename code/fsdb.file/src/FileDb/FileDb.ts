import { Subject } from 'rxjs';
import { share } from 'rxjs/operators';
import { timestamp, fs, t, defaultValue, DbUri } from '../common';
import { FileDbSchema } from '../FileDbSchema';

export type IFileDbArgs = {
  dir: string;
  cache?: boolean;
  schema?: t.IFileDbSchema;
};

/**
 * A DB that writes to the file-system.
 */
export class FileDb implements t.IDb {
  /**
   * [Static]
   */
  public static DELETED_SUFFIX = '._del';
  public static timestamp = timestamp;

  public static create(args: IFileDbArgs) {
    return new FileDb(args);
  }

  /**
   * [Lifecycle]
   */
  private constructor(args: IFileDbArgs) {
    this.dir = fs.resolve(args.dir);
    this.cache.isEnabled = Boolean(args.cache);
    this.schema = args.schema || FileDbSchema.DEFAULT;
  }

  public dispose() {
    this._dispose$.next();
    this._dispose$.complete();
  }
  public get isDisposed() {
    return this._dispose$.isStopped;
  }

  /**
   * [Fields]
   */
  public readonly dir: string;
  public readonly schema: t.IFileDbSchema;
  private readonly uri = DbUri.create();

  public readonly cache: t.IFileDbCache = {
    isEnabled: false,
    values: {},
    exists: (key: string) => this.cache.values[key] !== undefined,
    clear: (keys?: string[]) => {
      const remove = (key: string) => {
        if (this.cache.exists(key)) {
          delete this.cache.values[key];
        }
      };
      (keys || Object.keys(this.cache.values)).forEach(remove);
    },
  };

  private readonly _dispose$ = new Subject<void>();
  public readonly dispose$ = this._dispose$.pipe(share());

  private readonly _events$ = new Subject<t.DbEvent>();
  public readonly events$ = this._events$.pipe(share());

  /**
   * [Methods]
   */
  public toString() {
    return `[DB:${this.dir}]`;
  }

  /**
   * [Get]
   */
  public async get(key: string): Promise<t.IDbValue> {
    const cachedValue = this.cache.isEnabled ? this.cache.values[key] : undefined;

    const fire = (result: t.IDbValue) => {
      const { value, props } = result;
      this.fire({
        type: 'DOC/read',
        payload: { action: 'get', key, value, props },
      });
    };

    // Return value from cache.
    if (this.cache.isEnabled && cachedValue !== undefined) {
      fire(cachedValue);
      return cachedValue;
    }

    // Read value from file-system.
    const res = await FileDb.get({ dir: this.dir, key: key.toString(), schema: this.schema });
    fire(res);

    // Store value in cache (if required).
    if (this.cache.isEnabled) {
      this.cache.values[key] = res;
    }

    // Finish up.
    return res;
  }

  public static async get(args: {
    schema: t.IFileDbSchema;
    dir: string;
    key: string;
  }): Promise<t.IDbValue> {
    const { schema, dir, key } = args;
    const path = FileDbSchema.path({ schema, dir, key });
    const exists = await fs.pathExists(path);
    const props: t.IDbValueProps = { key, exists, createdAt: -1, modifiedAt: -1 };
    const NO_EXIST = { value: undefined, props: { ...props, exists: false } };

    if (!exists) {
      return NO_EXIST;
    }
    try {
      const text = (await fs.readFile(path)).toString();
      let json = JSON.parse(text);
      json = typeof json === 'object' ? json[key] : undefined;
      if (!json) {
        return NO_EXIST;
      }
      props.createdAt = typeof json.createdAt === 'number' ? json.createdAt : props.createdAt;
      props.modifiedAt = typeof json.modifiedAt === 'number' ? json.modifiedAt : props.modifiedAt;
      return { value: json.data, props };
    } catch (error) {
      throw new Error(`Failed to get value for key '${key}'. ${error.message}`);
    }
  }

  public async getValue<T extends t.Json | undefined>(key: string): Promise<T> {
    const res = await this.get(key);
    return res.value as T;
  }

  public async getMany(keys: string[]): Promise<t.IDbValue[]> {
    return Promise.all(keys.map((key) => this.get(key)));
  }

  /**
   * [Put]
   */
  public async put(key: string, value?: t.Json, options?: t.IDbPutOptions): Promise<t.IDbValue> {
    const { createdAt, modifiedAt } = (options || {}) as t.IDbPutOptions;

    if (typeof value === 'object' && value !== null) {
      value = timestamp.increment(value);
    }

    const res = await FileDb.put({
      schema: this.schema,
      dir: this.dir,
      key,
      value,
      createdAt,
      modifiedAt,
    });
    this.fire({
      type: 'DOC/change',
      payload: { action: 'put', key, value: res.value, props: res.props },
    });

    if (this.cache.isEnabled) {
      this.cache.clear([key]); // Invalidate cache.
    }
    return res;
  }

  public static async put(args: {
    schema: t.IFileDbSchema;
    dir: string;
    key: string;
    value?: t.Json;
    createdAt?: number;
    modifiedAt?: number;
  }): Promise<t.IDbValue> {
    const { schema, dir, key, value } = args;
    const path = FileDbSchema.path({ schema, dir, key });
    await fs.ensureDir(fs.dirname(path));

    // Prepare the JSON for storage.
    const current = await FileDb.get({ schema, dir, key });
    let json = timestamp.increment({
      data: value,
      createdAt: defaultValue(args.createdAt, current.props.createdAt),
      modifiedAt: defaultValue(args.modifiedAt, current.props.modifiedAt),
    });

    json.createdAt = args.createdAt ? args.createdAt : json.createdAt;
    json.modifiedAt = args.modifiedAt ? args.modifiedAt : json.modifiedAt;

    // If the key is mapped to a different file (via the schema)
    // place it as the sub-field on the object.
    const file = (await fs.pathExists(path)) ? await fs.readJson(path) : {};
    json = { ...file, [key]: json };

    // Write to disk.
    await fs.writeFile(path, JSON.stringify(json, null, '  '));

    // Finish up.
    const props: t.IDbValueProps = {
      key,
      exists: true,
      createdAt: json[key].createdAt,
      modifiedAt: json[key].modifiedAt,
    };
    return { value, props };
  }

  public async putMany(items: t.IDbPutItem[]): Promise<t.IDbValue[]> {
    let results: t.IDbValue[] = [];
    for (const item of items) {
      // NB:  This is done in serial in case there are cells that map into the
      //      same file (via the schema) to prevent overriding while another key/file
      //      is in the process of being written.
      const { key, value, createdAt, modifiedAt } = item;
      results = [...results, await this.put(key, value, { createdAt, modifiedAt })];
    }
    return results;
  }

  /**
   * [Delete]
   */
  public async delete(key: string): Promise<t.IDbValue> {
    const res = await FileDb.delete({ schema: this.schema, dir: this.dir, key });
    this.fire({
      type: 'DOC/change',
      payload: { action: 'delete', key, value: res.value, props: res.props },
    });
    return res;
  }

  public static async delete(args: {
    schema: t.IFileDbSchema;
    dir: string;
    key: string;
  }): Promise<t.IDbValue> {
    const { schema, dir, key } = args;
    const path = FileDbSchema.path({ schema, dir, key });
    const existing = await FileDb.get({ schema, dir, key });
    if (existing.props.exists) {
      const rename = `${path}${FileDb.DELETED_SUFFIX}`;
      await fs.rename(path, rename);
    }
    return {
      value: undefined,
      props: { key, exists: false, createdAt: -1, modifiedAt: -1 },
    };
  }
  public async deleteMany(keys: string[]): Promise<t.IDbValue[]> {
    return Promise.all(keys.map((key) => this.delete(key)));
  }

  /**
   * Find (glob).
   */
  public async find(query: string | t.IDbQuery): Promise<t.IDbFindResult> {
    const pattern = (typeof query === 'object' ? query.path : query) || '';

    // Results.
    let paths: string[] = [];
    let obj: t.IDbFindResult['map'] | undefined;
    let list: t.IDbValue[] = [];
    let keys: string[] = [];
    let error: Error | undefined;

    // Query file system using glob.
    try {
      if (pattern) {
        const uri = this.uri.parse(pattern);
        const dir = fs.join(this.dir, uri.path.dir);
        const file = `${dir}.json`;
        if (await fs.is.file(file)) {
          paths = [file];
        } else {
          if (await fs.is.dir(dir)) {
            const glob = fs.join(dir, uri.path.suffix);
            paths = await fs.glob.find(glob);
          }
        }
      } else {
        paths = await fs.glob.find(fs.join(this.dir, '**'));
      }

      // Retrieve matching files.
      paths = paths.filter((path) => path.endsWith('.json'));
      const files = await Promise.all(paths.map((path) => fs.readJson(path)));
      keys = files.reduce((acc, next) => {
        const keys = Object.keys(next);
        return [...acc, ...keys];
      }, []);
      list = await this.getMany(keys);
    } catch (err) {
      error = err;
    }

    // Construct return data-structure.
    const result: t.IDbFindResult = {
      length: keys.length,
      keys,
      list,
      get map() {
        if (!obj) {
          obj = list.reduce((acc, next) => {
            acc[next.props.key] = next.value;
            return acc;
          }, {});
        }
        return obj;
      },
      error,
    };

    // Finish up.
    return result;
  }

  /**
   * [Helpers]
   */

  private fire(e: t.DbEvent) {
    this._events$.next(e);
  }
}
