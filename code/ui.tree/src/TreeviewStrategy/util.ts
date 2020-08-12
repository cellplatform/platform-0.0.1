import { TreeQuery } from '@platform/state/lib/TreeQuery';
import { dispose } from '@platform/util.value';
import { Subject } from 'rxjs';

import { t } from '../common';
import { TreeEvents } from '../TreeEvents';
import { mutations } from './mutations';

export { dispose };

type N = t.ITreeviewNode;

/**
 * Wrangle input options for a strategy.
 */
export const options = () => {
  const treeview$ = new Subject<t.TreeviewEvent>();
  const events = TreeEvents.create(treeview$);
  return { treeview$, events };
};

/**
 * Current helpers
 */
export const current = (tree: t.ITreeState) => {
  const getter = get(tree);
  return {
    get: getter,
    query: getter.query,
    mutate: mutations(tree),
  };
};

export const props = (node?: N) => node?.props?.treeview || {};

/**
 * Query helpers.
 */
export function get(tree: t.ITreeState) {
  const query = TreeQuery.create<N>({ root: tree.root });
  const get = {
    query,
    get root() {
      return tree.root as N;
    },
    get nav() {
      return get.root.props?.treeview?.nav || {};
    },
    get selected() {
      return get.nav.selected;
    },
    get current() {
      return get.nav.current;
    },
    node(id?: t.NodeIdentifier) {
      return id ? (query.findById(id) as N) : get.root;
    },
    children(parent?: t.NodeIdentifier) {
      return get.node(parent)?.children || [];
    },
  };
  return get;
}
