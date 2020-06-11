import { MemoryCache, t } from '../../common';
import { fetcher } from '../../TypeSystem.util';
import { TypeCacheKey } from './TypeCacheKey';

/**
 * Cache enable a data-fetcher.
 */
export function wrapFetch(fetch: t.ISheetFetcher, options: { cache?: t.IMemoryCache } = {}) {
  if ((fetch as t.CachedFetcher).cache instanceof MemoryCache) {
    return fetch as t.CachedFetcher;
  }

  const cache = options.cache || MemoryCache.create();
  const cacheKey = TypeCacheKey.fetch;

  const getNs: t.FetchSheetNs = async (args) => {
    const key = cacheKey('getNs', args.ns.toString());
    return cache.exists(key) ? cache.get(key) : cache.put(key, fetch.getNs(args)).get(key);
  };

  const getColumns: t.FetchSheetColumns = async (args) => {
    const key = cacheKey('getColumns', args.ns.toString());
    return cache.exists(key) ? cache.get(key) : cache.put(key, fetch.getColumns(args)).get(key);
  };

  const getCells: t.FetchSheetCells = async (args) => {
    const key = cacheKey('getCells', args.ns.toString(), args.query);
    return cache.exists(key) ? cache.get(key) : cache.put(key, fetch.getCells(args)).get(key);
  };

  const res: t.CachedFetcher = {
    cache,
    cacheKey,
    ...fetcher.fromFuncs({ getNs, getColumns, getCells }),
  };

  return res;
}
