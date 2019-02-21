import { Subject } from 'rxjs';
import { filter, map, share, takeUntil } from 'rxjs/operators';

import { HyperDb } from '../db/main';
import * as t from '../types';
import swarmDefaults from './main.defaults';

const swarmDefaults2 = require('dat-swarm-defaults');

const discovery = require('discovery-swarm');

/**
 * Represents a connection to a swarm of peers.
 *
 * See:
 *  - https://github.com/mafintosh/discovery-swarm
 *  - https://github.com/maxogden/discovery-channel
 *
 */
export class Swarm {
  public readonly id: string;

  private readonly _ = {
    db: (null as unknown) as HyperDb,
    swarm: null as any,
    isDisposed: false,
    dispose$: new Subject(),
    events$: new Subject<t.SwarmEvent>(),
  };

  public readonly dispose$ = this._.dispose$.pipe(share());
  public readonly events$ = this._.events$.pipe(
    takeUntil(this.dispose$),
    share(),
  );

  constructor(args: { db: HyperDb; autoAuth?: boolean; join?: boolean }) {
    const { db, join = false, autoAuth = false } = args;
    const id = db.key.toString('hex');
    this.id = id;
    this._.db = db;
    this.dispose$.subscribe(() => (this._.isDisposed = true));

    // Create the swarm and listen for connection events.
    const defaults = swarmDefaults({
      id,
      stream: function(peer: any) {
        console.log('replicate // PROPER NEW');
        return db.replicate({
          // TODO: figure out what this truly does
          live: true,
          userData: db.local.key,
        });
      },
    });
    // const defaults = swarmDefaults({
    //   id,
    //   stream: peer => {
    //     console.log('REPLICATE PROPER');
    //     return db.replicate({ live: true });
    //   },
    // });
    console.log('default', defaults);
    const swarm = discovery(defaults);
    this._.swarm = swarm;

    if (join) {
      this.join();
    }

    this.events$
      .pipe(
        filter(e => e.type === 'SWARM/connection'),
        filter(() => autoAuth),
        map(e => e.payload as t.ISwarmConnectionEvent['payload']),
        filter(e => Boolean(e.peer.remoteUserData)), // https://github.com/karissa/hyperdiscovery/pull/12#pullrequestreview-95597621
      )
      .subscribe(async e => {
        const peerKey = Buffer.from(e.peer.remoteUserData);
        const { isAuthorized } = await this.authorize(peerKey);
        console.log('peer connected', peerKey.toString('hex'), isAuthorized);
        if (isAuthorized) {
          this.next<t.ISwarmPeerConnectedEvent>('SWARM/peerConnected', { isAuthorized, peerKey });
        }
      });

    swarm.on('connection', (peer: t.IProtocol) => {
      this.next<t.ISwarmConnectionEvent>('SWARM/connection', { peer });
    });
  }

  public dispose() {
    this._.dispose$.next();
  }

  public get isDisposed() {
    return this._.isDisposed;
  }

  /**
   * Connects to the swarm.
   */
  public join() {
    return new Promise(resolve => {
      this._.swarm.join(this.id, undefined, () => resolve());
    });
  }

  /**
   * Attempts to authorize a peer.
   */
  public async authorize(peerKey: Buffer) {
    const key = peerKey.toString('hex');
    try {
      const db = this._.db;
      const isAuthorized = await db.isAuthorized(peerKey);
      if (!isAuthorized) {
        await db.authorize(peerKey);
      }
      console.log('authorized', isAuthorized, key);
      return { isAuthorized };
    } catch (err) {
      const error = new Error(`Failed to authorize peer '${key}'. ${err.message}`);
      this.fireError(error);
      return { isAuthorized: false, error };
    }
  }

  /**
   * [INTERNAL]
   */
  private fireError(error: Error) {
    this.next<t.ISwarmErrorEvent>('SWARM/error', { error });
  }

  private next<E extends t.SwarmEvent>(type: E['type'], payload: E['payload']) {
    const e = { type, payload };
    this._.events$.next(e as t.SwarmEvent);
  }
}
