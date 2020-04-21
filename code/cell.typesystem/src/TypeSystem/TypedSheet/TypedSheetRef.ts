import { t, Uri, util, Schema } from './common';

export type IArgs = {
  typeDef: t.IColumnTypeDef<t.ITypeRef>;
  ctx: t.SheetCtx;
};

/**
 * A connector for a reference-pointer to a single row in another sheet.
 *
 * 🐷 NOT IMPLEMENTED YET
 *    -------------------
 *    Initial implementation within [TypedSheetRefs] plural/list.
 *    The way to handle this implementation will become apparent
 *    after some initial uses of [TypedSheetRefs].
 *
 */
export class TypedSheetRef<T> implements t.ITypedSheetRef<T> {
  public static create<T>(args: IArgs) {
    return new TypedSheetRef<T>(args);
  }

  /**
   * [Lifecycle]
   */
  private constructor(args: IArgs) {
    this.typeDef = args.typeDef;
    this.ctx = args.ctx;
  }

  /**
   * [Fields]
   */
  private readonly ctx: t.SheetCtx;
  public readonly typeDef: t.IColumnTypeDef<t.ITypeRef>;
}
