import { t } from '../common';

export type INs = { id: string; props?: INsProps; hash?: string };
export type INsProps = {
  name?: string; // Display name.
  schema?: string; // The semver of the [@platform/cell.schema] the namespace was last saved as.
};

/**
 * A "namespace" is a logically related set of cells
 * (aka: a "sheet", "table" or "grid").
 */
export type INsData<
  V extends t.ICellData = t.ICellData,
  C extends t.IColumnData = t.IColumnData,
  R extends t.IRowData = t.IRowData,
  F extends t.IFileData = t.IFileData
> = INsDataChildren<V, C, R, F> & { ns: INs };

/**
 * Data structures that are addressable within the namespace
 * with coordinates (eg "A1", "A", "1").
 */
export type INsDataCoord<
  V extends t.ICellData = t.ICellData,
  C extends t.IColumnData = t.IColumnData,
  R extends t.IRowData = t.IRowData
> = {
  cells: t.ICellMap<V>;
  columns: t.IColumnMap<C>;
  rows: t.IRowMap<R>;
};

/**
 * All child data structures within the namespace.
 */
export type INsDataChildren<
  V extends t.ICellData = t.ICellData,
  C extends t.IColumnData = t.IColumnData,
  R extends t.IRowData = t.IRowData,
  F extends t.IFileData = t.IFileData
> = INsDataCoord<V, C, R> & {
  files: t.IFileMap<F>;
};
