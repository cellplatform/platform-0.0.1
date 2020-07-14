import { t } from '../common';
import { BindingMonitor } from './BindingMonitor';

/**
 * Initialize all controller modules.
 */
export function init(args: { grid: t.IGrid }) {
  const { grid } = args;

  // Common command-event-firing helper.
  const fire = (command: t.GridCommand, e: t.IGridKeydown, props: Record<string, unknown> = {}) => {
    grid.command({ command, props, cancel: () => e.cancel() });
  };

  // Monitor keyboard commands.
  const bindings = new BindingMonitor({ grid });
  const monitor = (command: t.GridCommand) => bindings.monitor(command, (e) => fire(command, e));

  // Clipboard.
  monitor('CUT');
  monitor('COPY');
  monitor('PASTE');

  // Style.
  monitor('BOLD');
  monitor('ITALIC');
  monitor('UNDERLINE');
}
