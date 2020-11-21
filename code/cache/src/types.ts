/**
 * In-Memory Cache.
 */
export type MemoryCacheFilter = (key: string) => boolean;
export type MemoryCacheGetValue<V> = () => V;

export type IMemoryCacheGetOptions<V> = {
  getValue?: MemoryCacheGetValue<V>;
  force?: boolean;
};

export type IMemoryCache<K extends string = string> = {
  readonly ttl: number | undefined;
  readonly keys: string[];
  exists(key: K): boolean;
  get<V>(key: K, args?: MemoryCacheGetValue<V> | IMemoryCacheGetOptions<V>): V;
  getAsync<V>(key: K, args?: MemoryCacheGetValue<V> | IMemoryCacheGetOptions<V>): Promise<V>;
  put<V>(key: K, value: V): IMemoryCache<K>;
  delete(key: K): IMemoryCache<K>;
  clear(args?: { filter?: MemoryCacheFilter }): IMemoryCache<K>;
  clone(): IMemoryCache<K>;
};

/**
 * File Cache.
 */
export type IFileCache = {
  readonly dir: string;
  exists(path: string): Promise<boolean>;
  get(path: string): Promise<Uint8Array | undefined>;
  put(path: string, data: string | Uint8Array): Promise<void>;
};
