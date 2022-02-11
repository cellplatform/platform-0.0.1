import React from 'react';

import { Card, css, CssValue, t, useLocalPeer } from './DEV.common';
import { DevNetworkBody } from './DEV.Network.Body';
import { DevNetworkFooter } from './DEV.Network.Footer';
import { DevNetworkTitlebar } from './DEV.Network.Titlebar';
import { DevChild } from './DEV.Network.Child';
import { NetbusCard } from '../NetbusCard';

/**
 * Types
 */
export type DevNetworkView = 'URI' | 'Singular' | 'Collection';
export type DevNetworkProps = {
  view?: DevNetworkView;
  network: t.PeerNetwork;
  style?: CssValue;
};

/**
 * Component
 */
export const VIEWS: DevNetworkView[] = ['URI', 'Singular', 'Collection'];
const VIEW: DevNetworkView = 'Collection';
const DEFAULT = { VIEW };
export const DevNetworkConstants = { VIEWS, DEFAULT };

export const DevNetwork: React.FC<DevNetworkProps> = (props) => {
  const { network, view = DEFAULT.VIEW } = props;
  const { bus } = network;
  const self = network.netbus.self;

  const peer = useLocalPeer({ self, bus });
  const status = peer.status;
  const peers = status?.connections || [];

  /**
   * [Render]
   */
  const styles = {
    base: css({
      boxSizing: 'border-box',
      Flex: 'x-stretch-stretch',
    }),
    card: css({
      Flex: 'y-stretch-stretch',
      minWidth: 600,
      minHeight: 300,
    }),
    fill: css({ flex: 1 }),
  };

  /**
   * TODO 🐷
   * - determine content based on root card's selection state.
   */
  const elTMP = <NetbusCard netbus={network.netbus} style={styles.fill} />;

  const elRootCard = (
    <Card style={styles.card}>
      <DevNetworkTitlebar bus={bus} self={self} />
      <DevNetworkBody bus={bus} self={self} peers={peers} status={status} style={{ flex: 1 }} />
      <DevNetworkFooter bus={bus} self={self} />
    </Card>
  );

  const elChild = <DevChild>{elTMP}</DevChild>;

  return (
    <div {...css(styles.base, props.style)}>
      {elRootCard}
      {elChild}
    </div>
  );
};
