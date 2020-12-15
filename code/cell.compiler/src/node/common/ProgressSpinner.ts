import ora from 'ora';

import { log, value } from './libs';

/**
 * A CLI spinner that reports progress.
 */
export function ProgressSpinner(args: { label?: string; total?: number; silent?: boolean }) {
  const instance = ora();

  const state = {
    completed: -1,
    total: args.total || -1,
    label: (args.label || '').trim(),
  };

  const updateText = () => {
    let label = state.label;
    label = label.trim();

    if (state.completed >= 0 && state.total > 0) {
      const percent = value.round(state.completed / state.total, 0);
      label = `${label} (${percent}%)`;
    }

    instance.text = log.gray(label);
  };

  const spinner = {
    start() {
      updateText();
      if (!args.silent) {
        instance.start();
      }
      return spinner;
    },
    stop() {
      instance.text = '';
      instance.stop();
      return spinner;
    },
    update(options: { total?: number; completed?: number; label?: string } = {}) {
      state.total = typeof options.total === 'number' ? options.total : state.total;
      state.completed = typeof options.completed === 'number' ? options.completed : state.completed;
      updateText();
      return spinner;
    },
  };

  return spinner;
}
