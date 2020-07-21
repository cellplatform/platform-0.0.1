import { StateObject } from '@platform/state/lib/StateObject';
import { id as idUtil, rx } from '@platform/util.value';
import { Subject } from 'rxjs';
import { filter, map, share, take, takeUntil } from 'rxjs/operators';

import { t } from '../../common';
import { TreeUtil } from '../../TreeUtil';
import { TreeNodeId } from '../TreeNodeId';
import { helpers } from './helpers';

type N = t.ITreeNode;

/**
 * State machine for programming a tree, or partial leaf within a tree.
 *
 * NOTE:
 *    All changes to the state tree are immutable.
 *
 */
export class TreeState<T extends N = N> implements t.ITreeState<T> {
  public static create<T extends N = N>(args?: t.ITreeStateArgs<T>) {
    const root = args?.root || 'node';
    const e = { ...args, root } as t.ITreeStateArgs<T>;
    return new TreeState<T>(e) as t.ITreeState<T>;
  }

  public static id = TreeNodeId;
  public static props = helpers.props;
  public static children = helpers.children;
  public static isInstance = helpers.isInstance;

  /**
   * Lifecycle
   */
  private constructor(args: t.ITreeStateArgs<T>) {
    // Wrangle the {root} argument into an object.
    const root = (typeof args.root === 'string' ? { id: args.root } : args.root) as T;

    // Store values.
    this._store = StateObject.create<T>(root);
    this.parent = args.parent;

    // Set the object with the initial state.
    this._change((draft) => helpers.ensureNamespace(draft, this.namespace), {
      silent: true,
      ensureNamespace: false, // NB: No need to do it in the function (we are doing it here).
    });

    // Dispose if given observable fires.
    if (args.dispose$) {
      args.dispose$.subscribe(() => this.dispose());
    }
  }

  public dispose() {
    this.children.forEach((child) => child.dispose());
    this._dispose$.next();
    this._dispose$.complete();
  }

  /**
   * [Fields]
   */
  private _store: t.IStateObjectWrite<T>;
  private _children: t.ITreeState[] = [];

  public readonly namespace = idUtil.cuid();
  public readonly parent: string | undefined;

  private _dispose$ = new Subject<void>();
  public readonly dispose$ = this._dispose$.pipe(share());

  private _event$ = new Subject<t.TreeStateEvent>();
  public readonly event$ = this._event$.pipe(takeUntil(this.dispose$), share());

  public readonly changed$ = this.event$.pipe(
    filter((e) => e.type === 'TreeState/changed'),
    map((e) => e.payload as t.ITreeStateChanged<T>),
  );

  /**
   * [Properties]
   */
  public get isDisposed() {
    return this._dispose$.isStopped;
  }

  public get root() {
    return this._store.state;
  }

  public get id() {
    return this.root.id;
  }

  public get children() {
    return [...this._children];
  }

  private get traverseMethods(): t.ITreeTraverse<T> {
    const find = this.find;
    const exists = this.exists;
    const walkDown = this.walkDown;
    const walkUp = this.walkUp;
    return { find, exists, walkDown, walkUp };
  }

  private get changeCtx(): t.TreeStateChangerContext<T> {
    return this.traverseMethods;
  }

  /**
   * [Methods]
   */

  public toId(input?: string): string {
    const id = TreeState.id.parse(input).id;
    return TreeState.id.format(this.namespace, id);
  }

  public payload<E extends t.TreeStateEvent>(type: E['type']) {
    return rx.payload<E>(this.event$, type);
  }

  public change: t.TreeStateChange<T> = (fn, options = {}) => this._change(fn, options);
  private _change(
    fn: t.TreeStateChanger<T>,
    options: { silent?: boolean; ensureNamespace?: boolean } = {},
  ) {
    const from = this.root;
    const ctx = this.changeCtx;

    const res = this._store.change((draft) => {
      fn(draft, ctx);
      if (options.ensureNamespace !== false) {
        helpers.ensureNamespace(draft, this.namespace);
      }
    });
    const { patches } = res;

    if (!options.silent) {
      const to = this.root;
      this.fire({ type: 'TreeState/changed', payload: { from, to, patches } });
    }

    return res;
  }

  public add<C extends N = N>(args: { parent?: string; root: C | string | t.ITreeState<C> }) {
    // Wrangle: Check if the arguments are in fact a [TreeState] instance.
    if (TreeState.isInstance(args)) {
      args = { parent: this.id, root: args as t.ITreeState<C> };
    }

    // Create the child instance.
    const child = this.getOrCreateInstance(args);
    if (this.childExists(child)) {
      const err = `Cannot add child '${child.id}' as it already exists within the parent '${this.root.id}'.`;
      throw new Error(err);
    }

    // Store the child instance.
    this._children.push(child);

    // Insert data into state-tree.
    this.change((root, ctx) => {
      TreeState.children<any>(root).push(child.root);
    });

    // Update state-tree when child changes.
    this.listen(child);

    // Remove when child is disposed.
    child.dispose$
      .pipe(take(1))
      .pipe(filter(() => this.childExists(child)))
      .subscribe(() => this.remove(child));

    // Finish up.
    this.fire({ type: 'TreeState/child/added', payload: { parent: this, child } });
    return child;
  }

  public remove(input: string | t.ITreeState) {
    const child = this.child(input);
    if (!child) {
      const err = `Cannot remove child-state as it does not exist in the parent '${this.root.id}'.`;
      throw new Error(err);
    }

    // Remove from local state.
    this._children = this._children.filter((item) => item.root.id !== child.root.id);

    // Finish up.
    this.fire({ type: 'TreeState/child/removed', payload: { parent: this, child } });
    return child;
  }

  /**
   * [Methods] - data traversal.
   */
  public walkDown: t.TreeStateWalkDown<T> = (fn) => {
    TreeUtil.walkDown(this.root, (e) => {
      const { node, index } = e;
      const { id, namespace } = TreeState.id.parse(node.id);
      if (namespace === this.namespace) {
        fn({
          id,
          index,
          namespace,
          node,
          stop: e.stop,
          skip: e.skip,
        });
      }
    });
    return;
  };

  public walkUp: t.TreeStateWalkUp<T> = (startAt, fn) => {
    const id = TreeState.id;
    startAt = typeof startAt === 'string' ? id.stripNamespace(startAt) : startAt;
    startAt = typeof startAt == 'string' ? this.find((e) => e.id === startAt) : startAt;

    if (!startAt) {
      return;
    }

    if (typeof startAt === 'object' && id.namespace(startAt.id) !== this.namespace) {
      return;
    }

    TreeUtil.walkUp<T>(this.root, startAt as any, (e) => {
      const { node, index } = e;
      const { id, namespace } = TreeState.id.parse(node.id);
      if (namespace === this.namespace) {
        fn({
          id,
          index,
          namespace,
          node,
          stop: e.stop,
        });
      }
    });

    return undefined;
  };

  public find: t.TreeStateFind<T> = (fn) => {
    let result: T | undefined;
    this.walkDown((e) => {
      if (fn(e)) {
        result = e.node;
        e.stop();
      }
    });
    return result;
  };

  public exists: t.TreeStateExists<T> = (fn) => Boolean(this.find(fn));

  /**
   * [Internal]
   */

  private fire(e: t.TreeStateEvent) {
    this._event$.next(e);
  }

  private child(id: string | t.ITreeState) {
    id = typeof id === 'string' ? id : id.root.id;
    return this._children.find((item) => item.root.id === id);
  }

  private childExists(input: string | t.ITreeState) {
    return Boolean(this.child(input));
  }

  private getOrCreateInstance<C extends N = N>(args: {
    parent?: string;
    root: C | string | t.ITreeState<C>;
  }): t.ITreeState<C> {
    const root = (typeof args.root === 'string' ? { id: args.root } : args.root) as C;
    if (TreeState.isInstance(root)) {
      return args.root as t.ITreeState<C>;
    }

    let parent = TreeNodeId.toString(args.parent);
    parent = parent ? parent : TreeNodeId.stripNamespace(this.id);

    if (!this.exists((e) => e.id === parent)) {
      const err = `Cannot add child-state because the parent node '${parent}' does not exist.`;
      throw new Error(err);
    }

    parent = TreeNodeId.format(this.namespace, parent);
    return TreeState.create<C>({ parent, root });
  }

  private listen(child: t.ITreeState) {
    type Changed = t.ITreeStateChangedEvent;
    type Removed = t.ITreeStateChildRemovedEvent;

    const removed$ = this.payload<Removed>('TreeState/child/removed').pipe(
      filter((e) => e.child.id === child.id),
    );

    removed$.subscribe((e) => {
      this.change((draft, ctx) => {
        // REMOVE child in state-tree.
        draft.children = TreeState.children(draft).filter(({ id }) => id !== child.id);
      });
    });

    child
      .payload<Changed>('TreeState/changed')
      .pipe(takeUntil(child.dispose$), takeUntil(removed$))
      .subscribe((e) => {
        this.change((draft, ctx) => {
          // UPDATE child in state-tree.
          const children = TreeState.children(draft);
          const index = children.findIndex(({ id }) => id === child.id);
          if (index > -1) {
            children[index] = e.to as T;
          }
        });
      });
  }
}
