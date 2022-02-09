import React from 'react';

import { NetbusCard } from '../NetbusCard';
import { color, COLORS, css, CssValue, t } from './DEV.common';

/**
 * TODO 🐷
 * - Factor <DevEventBusCard> into root `web.ui` folder
 */

export type DevChildCardProps = {
  bus: t.EventBus<any>;
  netbus: t.PeerNetbus<any>;
  style?: CssValue;
};

export const DevChildCard: React.FC<DevChildCardProps> = (props) => {
  const { bus, netbus } = props;

  /**
   * [Render]
   */
  const styles = {
    base: css({
      position: 'relative',
      Flex: 'x-stretch-stretch',
    }),
    card: css({
      minWidth: 300,
      flex: 1,
      display: 'flex',
    }),
    divider: {
      base: css({ Flex: 'y-center-center', width: 30 }),
      bar: css({ width: '100%', borderTop: `solid 12px ${color.alpha(COLORS.DARK, 0.1)}` }),
    },
  };

  const elDivider = (
    <div {...styles.divider.base}>
      <div {...styles.divider.bar}></div>
    </div>
  );

  return (
    <div {...css(styles.base, props.style)}>
      {elDivider}
      <NetbusCard netbus={netbus} style={styles.card} />
    </div>
  );
};
