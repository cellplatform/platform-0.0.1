import { t, compact } from './common';

const Table = require('cli-table'); // eslint-disable-line
const DEFAULTS = {
  BORDERLESS: {
    top: '',
    'top-mid': '',
    'top-left': '',
    'top-right': '',
    bottom: '',
    'bottom-mid': '',
    'bottom-left': '',
    'bottom-right': '',
    left: '',
    'left-mid': '',
    mid: '',
    'mid-mid': '',
    right: '',
    'right-mid': '',
    middle: ' ',
  },
};

/**
 * Creates a new table builder.
 */
export function table(log: t.ILog, options: t.ILogTableOptions = {}) {
  const { head = [], colWidths = [] } = options;

  let args: any = { head: compact(head), colWidths };
  if (options.border === false) {
    args = {
      ...args,
      chars: DEFAULTS.BORDERLESS,
      style: { 'padding-left': 0, 'padding-right': 0 },
    };
  }

  const tbl = new Table(args);
  const api: t.ILogTable = {
    /**
     * Adds a new row to the table.
     */
    add(columns: (string | number | undefined)[]) {
      tbl.push(columns.map(row => (row === undefined ? '' : row.toString())));
      return api;
    },

    /**
     * Converts the table to a string.
     */
    toString() {
      return tbl.toString();
    },

    /**
     * Logs the table to the console.
     */
    log() {
      log.info(api.toString());
      return api;
    },
  };

  return api;
}
