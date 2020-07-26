import { Observable, Subject } from 'rxjs';
import { filter, map, share, takeUntil } from 'rxjs/operators';

import { t } from '../common';

type Button = t.MouseEvent['button'];
type Target = t.TreeViewMouseTarget;

/**
 * Helpers for filtering different event streams for a tree with sensible defaults.
 */
export class TreeEvents<N extends t.ITreeViewNode = t.ITreeViewNode> implements t.ITreeEvents<N> {
  public static create<N extends t.ITreeViewNode = t.ITreeViewNode>(
    event$: Observable<t.TreeViewEvent>,
    dispose$?: Observable<any>,
  ): t.ITreeEvents<N> {
    return new TreeEvents<N>(event$, dispose$);
  }

  /**
   * [Lifecycle]
   */
  private constructor(event$: Observable<t.TreeViewEvent>, dispose$?: Observable<any>) {
    this.event$ = event$.pipe(takeUntil(this.dispose$));
    if (dispose$) {
      dispose$.subscribe(() => this.dispose());
    }
  }

  public dispose() {
    this._dispose$.next();
    this._dispose$.complete();
  }

  /**
   * [Fields]
   */
  public readonly event$: Observable<t.TreeViewEvent>;

  private readonly _dispose$ = new Subject<void>();
  public readonly dispose$ = this._dispose$.pipe(share());

  /**
   * [Properties]
   */
  public get isDisposed() {
    return this._dispose$.isStopped;
  }

  /**
   * [Methods]
   */
  public mouse$ = (
    options: { button?: Button | Button[]; type?: t.MouseEventType; target?: Target } = {},
  ) => {
    const { type, target } = options;
    const buttons = toButtons(options.button);
    return this.event$.pipe(
      filter((e) => e.type === 'TREEVIEW/mouse'),
      map((e) => e.payload as t.TreeViewMouse<N>),
      filter((e) => {
        if (buttons.includes('RIGHT') && type === 'CLICK' && e.type === 'UP') {
          // NB: The CLICK event for a right button does not fire from the DOM
          //     so catch this pattern and return it as a "right-click" as its
          //     actually logical.
          return true;
        }
        return type ? e.type === type : true;
      }),
      filter((e) => buttons.includes(e.button)),
      filter((e) => (target ? e.target === target : true)),
    );
  };

  public mouse(options: { button?: Button | Button[] } = {}) {
    const button = toButtons(options.button);
    const mouse$ = this.mouse$;
    const targets = (type: t.MouseEventType) => {
      const args = { button, type };
      return {
        get $() {
          return mouse$({ ...args });
        },
        get node$() {
          return mouse$({ ...args, target: 'NODE' });
        },
        get drillIn$() {
          return mouse$({ ...args, target: 'DRILL_IN' });
        },
        get parent$() {
          return mouse$({ ...args, target: 'PARENT' });
        },
        get twisty$() {
          return mouse$({ ...args, target: 'TWISTY' });
        },
      };
    };
    return {
      get click() {
        return targets('CLICK');
      },
      get dblclick() {
        return targets('DOUBLE_CLICK');
      },
      get down() {
        return targets('DOWN');
      },
      get up() {
        return targets('UP');
      },
      get enter() {
        return targets('ENTER');
      },
      get leave() {
        return targets('LEAVE');
      },
    };
  }
}

/**
 * [Helpers]
 */

function toButtons(input?: Button | Button[], defaultValue: Button[] = ['LEFT']) {
  const buttons: Button[] = !input ? [] : Array.isArray(input) ? input : [input];
  return buttons.length === 0 ? defaultValue : buttons;
}
