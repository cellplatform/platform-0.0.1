import React from 'react';

import { PropListItem } from '..';
import { COLORS, css } from './common';

export const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nec quam lorem. Praesent fermentum, augue ut porta varius, eros nisl euismod ante, ac suscipit elit libero nec dolor. Morbi magna enim, molestie non arcu id, varius sollicitudin neque. In sed quam mauris. Aenean mi nisl, elementum non arcu quis, ultrices tincidunt augue. Vivamus fermentum iaculis tellus finibus porttitor. Nulla eu purus id dolor auctor suscipit. Integer lacinia sapien at ante tempus volutpat.';

const styles = {
  label: css({
    boxSizing: 'border-box',
    backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    flex: 1,
    height: 40,
    padding: 3,
    paddingLeft: 30,
    Flex: 'horizontal-end-end',
    color: COLORS.MAGENTA,
  }),
  value: css({
    backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    Flex: 'center-center',
    flex: 1,
    height: 30,
    borderRadius: 4,
  }),
};

export const items: PropListItem[] = [
  { label: 'string 👋', value: 'hello 🌳' },
  { label: 'number', value: { data: 123456, clipboard: 'Value: 123456', monospace: true } },
  { label: 'boolean', value: true },
  { label: 'boolean (switch)', value: { data: true, kind: 'Switch' } },
  { label: 'boolean (switch) - disabled', value: { data: undefined, kind: 'Switch' } },
  { label: 'clipboard function', value: { data: 'hello', clipboard: () => Math.random() } },
  { label: '<Text.Syntax>', value: { data: '{object}, [1,2,3]', monospace: true } },
  {
    label: 'monospace (fontSize: 9)',
    value: { data: 'thing', clipboard: true, monospace: true, color: COLORS.CYAN, fontSize: 9 },
  },
  { label: 'long (ellipsis)', value: LOREM },
  { label: 'bold', value: { data: 'value', bold: true } },
  {
    label: 'click handler',
    value: {
      data: 'click me',
      onClick: (e) => e.message(<div style={{ color: COLORS.MAGENTA }}>clicked!</div>, 1200),
    },
  },
  {
    label: 'label',
    value: <div {...styles.value}>value</div>,
  },
  {
    label: <div {...styles.label}>label</div>,
    value: 'value',
  },
  {
    label: 'component (clipboard)',
    value: {
      data: <div {...styles.value}>value</div>,
      clipboard: () => `random: ${Math.random()}`,
      onClick: (e) => {
        e.message(<div style={{ color: COLORS.MAGENTA }}>clicked!</div>, 1200);
      },
    },
  },
];
