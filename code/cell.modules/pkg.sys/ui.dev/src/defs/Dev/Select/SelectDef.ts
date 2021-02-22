import { filter } from 'rxjs/operators';

import { Context, Handler, is, Model, rx, t } from '../common';
import { Select as Component } from '../../../components/Action.Dev';
import { config } from './SelectDef.config';

type T = t.ActionSelect;
type P = t.ActionSelectHandlerArgs<any>;
type S = t.ActionHandlerSettings<P>;
type A = t.ActionHandlerSettingsSelectArgs;
type E = t.IActionSelectEvent;

export const SelectDef: t.ActionDef<T, E> = {
  kind: 'dev/select',
  Component,

  config: {
    method: 'select',
    handler(args) {
      const { item } = config(args.ctx, args.params);
      args.actions.change((draft) => draft.items.push(item));
    },
  },

  listen(args) {
    const { actions } = args;
    const { item } = Model.item<T>(actions, args.id);
    const namespace = actions.state.namespace;

    // Listen for events.
    rx.payload<E>(args.event$, 'dev:action/Select')
      .pipe(
        filter((e) => e.item.id === args.id),
        filter((e) => e.item.handlers.length > 0),
      )
      .subscribe((e) => {
        Context.getAndStore(actions, { throw: true });

        const { id } = e.item;
        const isSpinning = (value: boolean) =>
          actions.change((draft) => (Model.item<T>(draft, id).item.isSpinning = value));
        isSpinning(false);

        actions.changeAsync(async (draft) => {
          const { ctx, item, host, layout, env, actions } = Handler.params.payload<T>(id, draft);
          if (ctx && item) {
            const settings: S = (args) =>
              Handler.settings.handler<P, A>({
                env,
                payload,
                sync: {
                  source: (args) => args.select,
                  target: item,
                },
              })(args);

            const changing = e.changing;
            const select = item;
            const payload: P = { ctx, changing, host, layout, actions, select, settings };
            if (changing) item.current = changing.next; // Update the item to the latest selection.

            for (const fn of e.item.handlers) {
              const res = fn(payload);
              if (is.promise(res)) {
                isSpinning(true);
                await res;
                isSpinning(false);
              }
            }
          }
        });
      });

    // Initial state.
    if (item.handlers.length > 0) {
      args.fire({
        type: 'dev:action/Select',
        payload: { namespace, item },
      });
    }
  },
};
