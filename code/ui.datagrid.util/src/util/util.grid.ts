import { R, t } from '../common';
import { cell } from './util.cell';

/**
 * Determine if the given value is default.
 */
export function isDefaultGridValue(args: {
  defaults: t.IGridDefaults;
  kind: t.GridCellType;
  value?: any;
}) {
  const { kind, value, defaults } = args;

  switch (kind) {
    case 'COLUMN':
      return !value || R.equals(value, { width: defaults.columnWidth });
    case 'ROW':
      return !value || R.equals(value, { height: defaults.rowHeight });
    case 'CELL':
      return cell.value.isEmptyCell(value);
    default:
      throw new Error(`Kind '${kind}' not supported.`);
  }
}
