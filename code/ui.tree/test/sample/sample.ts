import { createRoot } from './util';
import { t, TreeView } from '../components/common';

export const SIMPLE: t.ITreeNode = {
  id: 'root',
  props: {
    label: 'Sheet',
    icon: 'Face',
    header: { isVisible: false },
  },
  children: [
    { id: 'child-1', props: { icon: 'Face', marginTop: 30 } },
    { id: 'child-2', props: { icon: 'Face' } },
    { id: 'child-3', props: { icon: 'Face' } },
    { id: 'child-4', props: { icon: 'Face' } },
    { id: 'child-5', props: { icon: 'Face' } },
  ],
};

export const COMPREHENSIVE = (() => {
  const p = TreeView.util.props;
  const root = createRoot([10, 5, 3, 2]);

  p(root).header = { isVisible: false };

  const children = root.children as t.ITreeNode[];
  children.forEach(node => {
    node.props = { ...p(node), inline: {} };
  });

  p(children[0]).inline = { isOpen: true };
  p(children[0]).label = 'inline open';
  p(children[0]).marginTop = 30;

  p(children[1]).label = 'custom child, inline';

  p(children[2]).inline = undefined;
  p(children[2]).label = 'custom child, drill-in';
  p(children[2]).header = { parentButton: false };

  p(children[3]).isEnabled = false;
  p(children[3]).label = 'disabled';

  p(children[4]).chevron = { isVisible: true };
  p(children[4]).label = 'twisty and drill-in';

  p(children[5]).inline = undefined;
  p(children[5]).isSpinning = true;
  p(children[5]).label = 'spinning';

  children[6].children = undefined;
  p(children[6]).label = 'no children';

  p(children[7]).icon = undefined;
  p(children[7]).label = 'has children, no icon';

  children[8].children = undefined;
  p(children[8]).icon = undefined;
  p(children[8]).label = 'no children, no icon';

  p(children[9]).inline = undefined;
  p(children[9]).badge = 5;
  p(children[9]).label = 'badge';
  p(children[9]).marginBottom = 50;

  return root;
})();
