import { BusEvents } from './BusEvents';
import { DEFAULT, pkg, rx, slug, t } from './common';

type Id = string;

/**
 * Event controller.
 */
export function BusController(args: {
  instance: { bus: t.EventBus<any>; id: Id };
  filter?: (e: t.MyEvent) => boolean;
}) {
  const { filter } = args;

  const bus = rx.busAsType<t.MyEvent>(args.instance.bus);
  const instance = args.instance.id;
  
  const events = BusEvents({ instance: args.instance, filter });
  const { dispose, dispose$ } = events;

  /**
   * Info (Module)
   */
  events.info.req$.subscribe(async (e) => {
    const { tx = slug() } = e;

    const { name = '', version = '' } = pkg;
    const info: t.MyInfo = { module: { name, version } };

    bus.fire({
      type: 'my.namespace/info:res',
      payload: { tx, instance, info },
    });
  });

  /**
   * API
   */
  return {
    instance: { bus: rx.bus.instance(bus), id: instance },
    dispose,
    dispose$,
    events,
  };
}
