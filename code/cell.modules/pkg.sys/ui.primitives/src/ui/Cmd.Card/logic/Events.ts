import { filter, takeUntil } from 'rxjs/operators';

import { Json, rx, t, Util } from '../common';

type O = Record<string, unknown>;
type S = t.CmdCardState;

/**
 * Event API
 */
export function CmdCardEvents<A extends O = any, B extends O = any>(
  args: t.CmdCardEventsArgs<A, B>,
) {
  const { dispose, dispose$ } = rx.disposable(args.dispose$);

  const instance = args.instance.id;
  const bus = rx.busAsType<t.CmdCardEvent>(args.instance.bus);

  const $ = bus.$.pipe(
    takeUntil(dispose$),
    filter((e) => e.type.startsWith('sys.ui.CmdCard/')),
    filter((e) => e.payload.instance === instance),
  );

  const events = Json.Bus.Events({ instance: args.instance, dispose$ });
  const state = events.json<S>(args.initial ?? Util.defaultState, { key: 'CmdCard' });

  /**
   * API
   */
  const api: t.CmdCardEventsDisposable<A, B> = {
    instance: events.instance,
    $,
    dispose,
    dispose$,
    state,
    clone() {
      const clone = { ...api };
      delete (clone as any).dispose;
      return clone;
    },
  };
  return api;
}
