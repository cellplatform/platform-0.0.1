import { useEffect, useState } from 'react';
import { filter } from 'rxjs/operators';

import { rx, t } from '../common';
import { CmdCardController } from './Controller';

export type UseCmdCardControllerArgs = t.CmdCardControllerArgs & {
  enabled?: boolean;
  controller?: (args: t.CmdCardControllerArgs) => t.CmdCardEventsDisposable; // Wrapper controller (the call-site's behavioral logic)
  onChange?: (e: t.CmdCardState) => void;
  onExecuteCommand?: t.CmdCardExecuteCommandHandler;
};

/**
 * Stateful <CmdCard> controller.
 */
export function useCmdCardController(args: UseCmdCardControllerArgs) {
  const { instance, enabled = true } = args;
  const busid = rx.bus.instance(instance.bus);

  const [state, setState] = useState<undefined | t.CmdCardState>(args.initial);

  /**
   * [Lifecycle]
   */
  useEffect(() => {
    const events =
      typeof args.controller === 'function'
        ? args.controller(args)
        : CmdCardController({ instance, initial: state });

    events.state.$.pipe(filter(() => enabled)).subscribe((next) => {
      setState(next.value);
      args.onChange?.(next.value);
    });

    if (args.onExecuteCommand) {
      events.commandbar.onExecuteCommand(args.onExecuteCommand);
    }

    return () => events.dispose();
  }, [instance.id, busid, enabled]); // eslint-disable-line

  /**
   * API
   */
  return {
    instance: { bus: busid, id: instance.id },
    enabled,
    state,
  };
}
