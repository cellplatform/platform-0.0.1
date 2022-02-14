import React from 'react';
import { DevEventBusTextbox } from '../../web.PeerNetwork/dev/DEV.event.netbus/DEV.NetbusCard.Textbox';

import { cuid, time, DevActions, ObjectView, TEST, slug } from '../../web.test';
import {
  EventBridge,
  color,
  COLORS,
  css,
  DevConstants,
  PeerNetwork,
  rx,
  t,
  MediaStream,
} from './DEV.common';
import { DevSample, DevSampleProps } from './DEV.Sample';

import PeerJS from 'peerjs';

type Ctx = {
  props: DevSampleProps;
  debug: { background: boolean };
};

const DEFAULT = {
  SIGNAL_SERVER: TEST.SIGNAL,
  VIEW: 'Collection',
};

const CHILD_TYPES: t.DevChildKind[] = ['None', 'Netbus', 'Crdt', 'Filesystem', 'Video'];

/**
 * Actions
 */
export const actions = DevActions<Ctx>()
  .namespace('dev.Networks')
  .context((e) => {
    if (e.prev) return e.prev;
    const ctx: Ctx = {
      props: {
        // view: DevNetworkConstants.DEFAULT.VIEW,
        view: 'Collection',
        // view: 'Single',
        child: 'Video',
        networks: [],
      },
      debug: { background: false },
    };
    return ctx;
  })

  .init(async (e) => {
    const { ctx } = e;

    if (ctx.props.networks.length === 0) {
      await addNetwork(ctx);
      await addNetwork(ctx);
    }

    // await time.wait(1500);
    // await autoConnect(ctx);
  })

  .items((e) => {
    e.title('Network Client');

    e.button('auto connect (peers)', (e) => autoConnect(e.ctx));
    e.hr(1, 0.1);

    e.title('View');
    e.select((config) => {
      config
        .view('buttons')
        // .title('view')
        .items(DevConstants.VIEWS)
        .initial(config.ctx.props.view)
        .pipe((e) => {
          if (e.changing) e.ctx.props.view = e.changing?.next[0].value;
        });
    });

    e.select((config) => {
      config
        .view('buttons')
        .title('child (card)')
        .items(CHILD_TYPES)
        .initial(config.ctx.props.child)
        .pipe((e) => {
          if (e.changing) {
            const next = e.changing?.next[0].value;
            const value = !next || next === '<undefined>' ? undefined : next;
            e.ctx.props.child = value;
          }
        });
    });

    e.hr(1, 0.1);
  })

  .items((e) => {
    e.title('Collection');
    e.button('add', (e) => addNetwork(e.ctx));

    e.hr(1, 0.1);
    e.button('clear', (e) => {
      const ctx = e.ctx;
      ctx.props.networks.forEach((network) => network.dispose());
      ctx.props.networks = [];
    });

    e.button('remove (last)', (e) => {
      const ctx = e.ctx;
      const index = ctx.props.networks.length - 1;
      const last = ctx.props.networks[index];
      if (last) {
        ctx.props.networks = ctx.props.networks.slice(0, index);
        last.dispose();
      }
    });

    e.hr();
  })

  .items((e) => {
    e.title('Debug');

    e.boolean('background', (e) => {
      if (e.changing) e.ctx.debug.background = e.changing.next;
      e.boolean.current = e.ctx.debug.background;
    });

    e.button('TMP', async (e) => {
      const a = await createNetwork();
      const b = await createNetwork();

      // await time.wait(1000);

      const conn = a.events.peer.connection(a.netbus.self, b.netbus.self);

      console.log('await conn.isConnected()', await conn.isConnected());

      const res = await conn.open.data();

      console.log('res', res);
      console.log('await conn.isConnected()', await conn.isConnected());
    });

    e.button('TMP-1', async (e) => {
      const A = `${cuid()}`;
      const B = `${cuid()}`;

      // console.log('id', id);
      const peer1 = new PeerJS(A);
      const peer2 = new PeerJS(B);

      peer2.on('connection', (conn) => {
        console.log('connection');
        conn.on('data', (data) => {
          console.log('data', data);
        });
        conn.on('open', () => {
          conn.send('hello!');
        });
      });

      peer1.on('connection', (conn) => {
        console.log('connection');
        conn.on('data', (data) => {
          console.log('data', data);
        });
        conn.on('open', () => {
          conn.send('hello!');
        });
      });

      // await time.wait(1200);

      /**
       * TODO 🐷
       * - Resolve connection
       */

      console.log('-------------------------------------------');

      peer1.on('open', () => {
        console.log('peer1 open');
        const conn1 = peer1.connect(B);

        conn1.on('open', () => {
          conn1.send('Hi');
        });
      });

      // console.log('conn1', conn1);

      // conn1.on('open', () => {
      //   conn1.send('Hi');
      // });

      // const conn = peer.connect('another-peers-id');
      // conn.on('open', () => {
      //   conn.send('hi!');
      // });
    });

    e.hr();
    e.component((e) => {
      const obj = (name: string, data: any) => {
        return <ObjectView name={name} data={data} style={{ MarginX: 15 }} expandPaths={['$']} />;
      };

      const styles = {
        div: css({ height: 1, Margin: [15, 0], backgroundColor: 'rgba(255, 0, 0, 0.1)' }),
      };

      const network = e.ctx.props.view === 'Single' ? e.ctx.props.networks[0] : undefined;
      const divider = <div {...styles.div} />;

      return (
        <div>
          {obj('props', e.ctx.props)}
          {network && divider}
          {network && obj('network[0]', network)}
        </div>
      );
    });
  })

  .subject((e) => {
    const { debug, props } = e.ctx;
    const { networks = [] } = props;
    const isEmpty = networks.length === 0;

    const view = props.view ?? DevConstants.DEFAULT.VIEW;
    const isCollection = view === 'Collection';
    const isUri = view === 'URI';

    e.settings({
      host: { background: -0.04 },
      layout: {
        cropmarks: -0.2,
        position: isCollection ? [40, 40, 80, 40] : undefined,
        // background: debug.background || isCollection ? -0.1 : 0,
        label: !isUri && {
          topLeft: !isEmpty && 'Peer-to-Peer',
          bottomLeft: !isEmpty && `WebRTC Signal: "${DEFAULT.SIGNAL_SERVER}"`,
        },
      },
    });

    /**
     * [Render]
     */
    const styles = {
      base: css({ flex: 1 }),
      outer: {
        base: css({
          Scroll: true,
          position: 'relative',
          overflow: 'hidden',
        }),
        bg: css({
          Absolute: 0,
          Padding: [45, 45],
          background: color.alpha(COLORS.DARK, 0.12),
          boxShadow: `inset 0 0 15px 0 ${color.format(-0.06)}`,
        }),
      },
    };

    const outerStyle = css(
      styles.outer.base,
      debug.background || isCollection ? styles.outer.bg : undefined,
    );

    e.render(
      <div {...styles.base}>
        <div {...outerStyle}>
          <DevSample {...props} />
        </div>
      </div>,
    );
  });

export default actions;

/**
 * Helpers
 */

async function createNetwork() {
  const bus = rx.bus();
  const signal = DEFAULT.SIGNAL_SERVER;
  const network = await PeerNetwork.start({ bus, signal });

  MediaStream.Controller({ bus });
  EventBridge.startEventBridge({ self: network.netbus.self, bus });

  return network;
}

async function addNetwork(ctx: Ctx) {
  const network = await createNetwork();
  ctx.props.networks.push(network);
}

async function autoConnect(ctx: Ctx) {
  const networks = ctx.props.networks;
  const [a, b] = networks;
  if (!a || !b) return;

  const conn = a.events.peer.connection(a.netbus.self, b.netbus.self);
  if (!(await conn.isConnected())) await conn.open.data({ isReliable: true });
}
