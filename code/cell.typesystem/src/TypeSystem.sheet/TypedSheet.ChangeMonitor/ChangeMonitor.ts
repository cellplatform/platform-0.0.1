import { Subject } from 'rxjs';
import { filter, share, takeUntil, map } from 'rxjs/operators';

import { t } from '../../common';

type S = t.ITypedSheet;
type W = { sheet: t.ITypedSheet; stop$: Subject<{}>; refs: t.ITypedSheetRefs<any, any>[] };

/**
 * Monitors changes in sheet(s).
 */
export class ChangeMonitor implements t.ITypedSheetChangeMonitor {
  public static create() {
    return new ChangeMonitor() as t.ITypedSheetChangeMonitor;
  }

  /**
   * [Lifecycle]
   */

  private constructor() {
    // Auto-watch child REFs as they are created.
    this.event$
      .pipe(
        filter((e) => e.type === 'SHEET/refs/loaded'),
        map((e) => e.payload as t.ITypedSheetRefsLoaded),
      )
      .subscribe(async (e) => {
        const item = this.item(e.sheet);
        if (item) {
          // Register the reference.
          item.refs.push(e.refs);

          // Monitor the sheet.
          const sheet = e.refs.sheet;
          this.watch(sheet);

          // Ensure the typesystem details are up-to-date.
          // NB: This "implements" update is made upon the creation of a new referenced sheet.
          const info = await sheet.info();
          const type = info.ns.type || {};
          if (!type.implements) {
            const uri = sheet.implements.toString();
            sheet.state.change.ns({ type: { implements: uri } });
          }
        }
      });

    this.changed$ = this.event$.pipe(
      filter((e) => e.type === 'SHEET/changed'),
      map((e) => e.payload as t.ITypedSheetChanged),
      filter((e) => Boolean(this.item(e.sheet))),
      share(),
    );
  }

  public dispose() {
    this._watching.forEach(({ sheet }) => this.unwatch(sheet));
    this._watching = [];
    this._dispose$.next();
    this._dispose$.complete();
  }

  /**
   * [Fields]
   */
  private readonly _dispose$ = new Subject<{}>();
  private readonly _event$ = new Subject<t.TypedSheetEvent>();
  private _watching: W[] = [];

  public readonly dispose$ = this._dispose$.pipe(share());
  public readonly event$ = this._event$.pipe(takeUntil(this.dispose$), share());
  public readonly changed$: t.Observable<t.ITypedSheetChanged>;

  /**
   * [Properties]
   */
  public get isDisposed() {
    return this._dispose$.isStopped;
  }

  public get watching(): t.ITypedSheet[] {
    return this._watching.map(({ sheet }) => sheet);
  }

  /**
   * [Methods]
   */
  public watch(sheet: S | S[]) {
    this.throwIfDisposed('watch');
    if (Array.isArray(sheet)) {
      sheet.forEach((sheet) => this.watch(sheet));
      return this;
    }
    if (!sheet || this.isWatching(sheet)) {
      return this;
    }
    this._watch(sheet);
    return this;
  }
  private _watch(sheet: S) {
    const stop$ = new Subject<{}>();
    sheet.event$.pipe(takeUntil(this.dispose$), takeUntil(stop$)).subscribe((e) => this.fire(e));
    sheet.dispose$.pipe(takeUntil(this.dispose$)).subscribe(() => this.unwatch(sheet));
    this._watching = [...this._watching, { sheet, stop$, refs: [] }];
  }

  public unwatch(sheet: S | S[]) {
    this.throwIfDisposed('unwatch');

    if (Array.isArray(sheet)) {
      sheet.forEach((subject) => this.unwatch(subject));
      return this;
    }

    const item = this.item(sheet);
    if (item) {
      item.stop$.next();
      item.stop$.complete();
      item.refs.forEach((ref) => this.unwatch(ref.sheet)); // <== RECURSION 🌳
      this._watching = this._watching.filter(({ sheet: state }) => state !== item.sheet);
    }

    return this;
  }

  public isWatching(sheet: S | S[]): boolean {
    this.throwIfDisposed('isWatching');
    if (Array.isArray(sheet)) {
      return sheet.length === 0 ? false : sheet.every((subject) => this.isWatching(subject));
    }
    return Boolean(this.item(sheet));
  }

  /**
   * [INTERNAL]
   */

  private item(sheet: S) {
    return this._watching.find((item) => item.sheet === sheet);
  }

  private fire(e: t.TypedSheetEvent) {
    this._event$.next(e);
  }

  private throwIfDisposed(action: string) {
    if (this.isDisposed) {
      throw new Error(`Cannot ${action} because [ChangeMonitor] is disposed.`);
    }
  }
}
