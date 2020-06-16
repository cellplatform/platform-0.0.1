/* eslint-disable @typescript-eslint/no-use-before-define */

import { Observable, Subject } from 'rxjs';
import { share, takeUntil } from 'rxjs/operators';

import { TypeClient } from '../../TypeSystem.core';
import { ERROR, ErrorList, MemoryCache, t, Uri } from './common';
import { TypedSheetData } from './TypedSheetData';
import { TypedSheetState } from './TypedSheetState';
import { SheetPool } from '../TypedSheet.SheetPool';
import { fetcher } from '../../TypeSystem.fetch';

const fromClient = (client: t.IHttpClient) => {
  const fetch = fetcher.fromClient(client);
  return {
    load: <T = {}>(ns: string | t.INsUri) => TypedSheet.load<T>({ fetch, ns }),
  };
};

/**
 * Represents a namespace as a logical sheet of cells.
 */
export class TypedSheet<T = {}> implements t.ITypedSheet<T> {
  public static client = fromClient;

  /**
   * Generates a standard [context] object that is thread
   * through the sheet hierarchy.
   */
  public static ctx(args: {
    fetch: t.ISheetFetcher;
    cache?: t.IMemoryCache;
    event$?: Subject<t.TypedSheetEvent>;
    dispose$?: Observable<{}>;
    pool?: t.ISheetPool;
  }): t.SheetCtx {
    const fetch = args.fetch;
    const cache = args.cache || MemoryCache.create();
    const event$ = args.event$ || new Subject<t.TypedSheetEvent>();
    const dispose$ = args.dispose$ || new Subject<{}>();
    const pool = args.pool || SheetPool.create();

    return {
      event$,
      dispose$,
      fetch,
      cache,
      pool,
      sheet: {
        load<T>(args: { ns: string }) {
          return TypedSheet.load<T>({ ...args, fetch, cache, event$ });
        },
        create<T>(args: { implements: string }) {
          return TypedSheet.create<T>({ ...args, fetch, cache, event$ });
        },
      },
    };
  }

  /**
   * Load a sheet from the network.
   */
  public static async load<T = {}>(args: {
    fetch: t.ISheetFetcher;
    ns: string | t.INsUri;
    cache?: t.IMemoryCache;
    event$?: Subject<t.TypedSheetEvent>;
    pool?: t.ISheetPool;
  }): Promise<t.ITypedSheet<T>> {
    const { fetch, cache, event$ } = args;
    const sheetNs = Uri.ns(args.ns);

    const pool = args.pool || SheetPool.create();
    if (pool.exists(args.ns)) {
      return pool.sheet(args.ns) as t.ITypedSheet<T>;
    }

    // Retrieve type definition for sheet.
    const res = await args.fetch.getNs({ ns: sheetNs.toString() });
    if (res.error) {
      throw new Error(res.error.message);
    }
    if (!res.ns?.type?.implements) {
      const err = `The namespace (${sheetNs}) does not contain an "implements" type reference.`;
      throw new Error(err);
    }
    const implementsNs = Uri.ns(res.ns?.type?.implements);

    // Load and parse the type definition.
    const typeDefs = await TypeClient.load({
      ns: implementsNs.toString(),
      fetch,
      cache,
    });

    // Finish up.
    const types = typeDefs.defs;
    const errors = typeDefs.errors;

    return new TypedSheet<T>({
      uri: sheetNs,
      implements: implementsNs,
      types,
      fetch,
      cache,
      event$,
      errors,
      pool,
    });
  }

  /**
   * Creates a sheet.
   */
  public static async create<T = {}>(args: {
    fetch: t.ISheetFetcher;
    implements: string | t.INsUri;
    ns?: string | t.INsUri; // NB: If not specified a new URI is generated.
    cache?: t.IMemoryCache;
    event$?: Subject<t.TypedSheetEvent>;
    pool?: t.ISheetPool;
  }): Promise<t.ITypedSheet<T>> {
    const { fetch, event$, cache } = args;
    const implementsNs = Uri.ns(args.implements);
    const sheetNs = args.ns ? Uri.ns(args.ns) : Uri.create.ns(Uri.cuid());

    const pool = args.pool || SheetPool.create();
    if (args.ns && pool.exists(args.ns)) {
      return pool.sheet(args.ns) as t.ITypedSheet<T>;
    }

    const typeDefs = await TypeClient.load({
      ns: implementsNs.toString(),
      fetch,
      cache,
    });

    const types = typeDefs.defs;
    const errors = typeDefs.errors;

    return new TypedSheet<T>({
      uri: sheetNs,
      implements: implementsNs,
      types,
      fetch,
      cache,
      event$,
      errors,
      pool,
    });
  }

  /**
   * [Lifecycle]
   */

  private constructor(args: {
    uri: string | t.INsUri;
    implements: string | t.INsUri;
    types: t.INsTypeDef[];
    fetch: t.ISheetFetcher;
    event$?: Subject<t.TypedSheetEvent>;
    cache?: t.IMemoryCache;
    errors?: t.ITypeError[];
    pool: t.ISheetPool;
  }) {
    this.uri = Uri.ns(args.uri);
    this.implements = Uri.ns(args.implements);
    this.pool = args.pool;

    const pool = this.pool;
    const cache = args.cache || MemoryCache.create();
    const event$ = args.event$ || new Subject<t.TypedSheetEvent>();
    const dispose$ = this.dispose$;

    this.event$ = event$.asObservable().pipe(takeUntil(dispose$), share());
    this.state = TypedSheetState.create({ sheet: this, event$, fetch: args.fetch, cache });

    this._ctx = TypedSheet.ctx({ fetch: this.state.fetch, event$, dispose$, cache, pool }); // NB: Use the state-machine's wrapped fetcher.
    this._typeDefs = args.types;
    this._errorList = ErrorList.create({ defaultType: ERROR.TYPE.SHEET, errors: args.errors });

    pool.add(this);
  }

  public dispose() {
    this._data = {};
    this._dispose$.next();
    this._dispose$.complete();
    this.state.dispose();
  }

  /**
   * [Fields]
   */

  private readonly _ctx: t.SheetCtx;
  private readonly _errorList: ErrorList;
  private readonly _dispose$ = new Subject<{}>();
  private readonly _typeDefs: t.INsTypeDef[];
  private _types: t.ITypedSheet['types'];
  private _data: { [typename: string]: TypedSheetData<any> } = {};

  public readonly uri: t.INsUri;
  public readonly implements: t.INsUri;
  public readonly state: TypedSheetState;
  public readonly pool: t.ISheetPool;
  public readonly dispose$ = this._dispose$.pipe(share());
  public readonly event$: Observable<t.TypedSheetEvent>;

  /**
   * [Properties]
   */

  public get isDisposed() {
    return this._dispose$.isStopped;
  }

  public get ok() {
    return this.errors.length === 0;
  }

  public get errors() {
    return this._errorList.list;
  }

  public get types() {
    if (!this._types) {
      const types: t.ITypedSheet['types'] = [];
      this._typeDefs.forEach((def) => {
        const { typename, columns } = def;
        const item = types.find((item) => item.typename === typename);
        if (item) {
          item.columns = [...item.columns, ...columns];
        } else {
          types.push({ typename, columns });
        }
      });
      this._types = types;
    }
    return this._types;
  }

  /**
   * [Methods]
   */
  public toString() {
    return this.uri.toString();
  }

  public async info<P extends t.INsProps = t.INsProps>() {
    const res = await this._ctx.fetch.getNs({ ns: this.uri.toString() });
    const exists = Boolean(res.ns);
    const ns = (res.ns || {}) as P;
    return { exists, ns };
  }

  public data<D = T>(input: string | t.ITypedSheetDataArgs) {
    this.throwIfDisposed('data');

    const args = typeof input === 'string' ? { typename: input } : input;
    const { typename, range } = args;
    const ctx = this._ctx;

    // Check the pool in case the cursor has already been created.
    if (this._data[typename]) {
      const res = this._data[typename];
      if (args.range && res.range !== args.range) {
        res.expandRange(args.range);
      }
      return res as t.ITypedSheetData<D>;
    }

    // Retrieve the specified type definition.
    const defs = this._typeDefs;
    const def = defs.find((def) => def.typename === typename);
    if (!def) {
      const names = defs.map((def) => `'${def.typename}'`).join(', ');
      const err = `Definitions for typename '${typename}' not found. Available typenames: ${names}.`;
      throw new Error(err);
    }

    // Construct the cursor.
    const types = def.columns;
    const res: t.ITypedSheetData<D> = TypedSheetData.create<D>({
      sheet: this,
      typename,
      types,
      ctx,
      range,
    });
    this._data[typename] = res as TypedSheetData<any>;
    return res;
  }

  public change(changes: t.ITypedSheetChanges) {
    // Namespace.
    if (changes.ns) {
      const change = changes.ns;
      if (this.isThisNamespace(change.ns)) {
        this.state.change.ns(change.to);
      } else {
        const ns = this.uri.toString();
        const err = `Requested change to [${change.ns}] is not in sheet [${ns}]`;
        throw new Error(err);
      }
    }

    // Cells.
    if (changes.cells) {
      const cells = changes.cells;
      Object.keys(cells)
        .map((key) => ({ key, change: cells[key] }))
        .forEach((e) => {
          if (this.isThisNamespace(e.change.ns)) {
            this.state.change.cell(e.key, e.change.to);
          } else {
            const ns = this.uri.toString();
            const cell = Uri.create.cell(e.change.ns, e.change.key);
            const err = `Requested change to [${cell}] is not in sheet [${ns}]`;
            throw new Error(err);
          }
        });
    }

    // Finish up.
    return this;
  }

  /**
   * [Internal]
   */

  private throwIfDisposed(action: string) {
    if (this.isDisposed) {
      throw new Error(`Cannot ${action} because [TypedSheet] is disposed.`);
    }
  }

  private isThisNamespace(input: string) {
    return Uri.strip.ns(input) === this.uri.id;
  }
}
