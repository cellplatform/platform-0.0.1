import { Subject } from 'rxjs';

import { HttpClient } from '../Client.http';
import { MemoryCache, t, TypeSystem } from '../common';

type N = string | t.INsUri;

/**
 * Access point for working with the TypeSystem.
 */
export function typesystem(input?: t.ClientOptions | string | number) {
  const args = typeof input === 'object' ? input : { http: input };
  // const { event$ } = args;
  const event$ = args.event$ ? (args.event$ as Subject<t.TypedSheetEvent>) : undefined;
  const cache = args.cache || MemoryCache.create();

  let change: t.ITypedSheetChangeMonitor | undefined;

  const http = HttpClient.isClient(args.http)
    ? (args.http as t.IHttpClient)
    : HttpClient.create(args.http as string);

  const fetch = TypeSystem.fetcher.fromClient(http);

  const api: t.IClientTypesystem = {
    http,
    fetch,
    cache,

    /**
     * The singleton change-monitor for the client.
     */
    get changes() {
      return change || (change = TypeSystem.ChangeMonitor.create());
    },

    /**
     * Retrieves the type-definitions for the given namespace(s).
     */
    async defs(ns: N | N[]) {
      const uris = Array.isArray(ns) ? ns : [ns];
      const client = TypeSystem.client(http);
      const defs = (await Promise.all(uris.map((ns) => client.load(ns)))).map(({ defs }) => defs);
      return defs.reduce((acc, next) => acc.concat(next), []); // Flatten [][] => [].
    },

    /**
     * Typescript generator for the given namespace(s).
     */
    async typescript(
      ns: N | N[],
      options: { header?: boolean; exports?: boolean; imports?: boolean } = {},
    ) {
      const defs = await api.defs(ns);
      return TypeSystem.Client.typescript(defs, options);
    },

    /**
     * Retrieve the strongly-typed sheet at the given namespace.
     */
    sheet<T>(ns: N) {
      return TypeSystem.Sheet.load<T>({ ns, fetch, cache, event$ });
    },
  };

  return api;
}
