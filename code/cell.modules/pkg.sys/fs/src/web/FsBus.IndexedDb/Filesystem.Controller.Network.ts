import { t } from './common';

/**
 * Controller for distributing an [Filesystem:IndexedDB] across
 * a peer-to-peer network.
 */
export function NetworkController(args: { events: t.SysFsEvents; netbus: t.NetworkBus<any> }) {
  const { events } = args;

  /**
   * TODO 🐷 WIP
   */
  console.group('🌳 WIP: fs.NetworkController');
  console.log('network');
  console.log('events.id', events.id);
  console.groupEnd();

  events.$.subscribe((e) => {
    console.log('$ NetworkController:', e);
  });

  // Finish up.
  return {};
}
