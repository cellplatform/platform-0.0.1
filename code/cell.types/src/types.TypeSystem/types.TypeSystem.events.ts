import { t } from '../common';

/**
 * [Events]
 */
export type TypedSheetEvent =
  | ITypedSheetLoadingEvent
  | ITypedSheetLoadedEvent
  | ITypedSheetRowLoadingEvent
  | ITypedSheetRowLoadedEvent
  | ITypedSheetRefsLoadingEvent
  | ITypedSheetRefsLoadedEvent
  | ITypedSheetChangeEvent
  | ITypedSheetChangedEvent
  | ITypedSheetChangesClearedEvent
  | ITypedSheetSyncEvent;

/**
 * Fires when a sheet cursor commences loading.
 */
export type ITypedSheetLoadingEvent = {
  type: 'SHEET/loading';
  payload: ITypedSheetLoading;
};
export type ITypedSheetLoading = {
  sheet: t.ITypedSheet;
  range: string; // row range, eg: "1:500"
};

/**
 * Fires when a sheet cursor completed a load operation.
 */
export type ITypedSheetLoadedEvent = {
  type: 'SHEET/loaded';
  payload: ITypedSheetLoaded;
};
export type ITypedSheetLoaded = ITypedSheetLoading & {
  total: number; // Total number of rows within the database.
};

/**
 * Fires when a sheet row commences loading.
 */
export type ITypedSheetRowLoadingEvent = {
  type: 'SHEET/row/loading';
  payload: ITypedSheetRowLoading;
};
export type ITypedSheetRowLoading = {
  sheet: t.ITypedSheet;
  index: number;
};

/**
 * Fires when a sheet row completes loading.
 */
export type ITypedSheetRowLoadedEvent = {
  type: 'SHEET/row/loaded';
  payload: ITypedSheetRowLoaded;
};
export type ITypedSheetRowLoaded = ITypedSheetRowLoading;

/**
 * Fires when a child Refs sheet starts loading
 */
export type ITypedSheetRefsLoadingEvent = {
  type: 'SHEET/refs/loading';
  payload: ITypedSheetRefsLoading;
};
export type ITypedSheetRefsLoading<T = {}> = {
  sheet: t.ITypedSheet;
  refs: t.ITypedSheetRefs<T>;
};

/**
 * Fires when a child Refs sheet loads.
 */
export type ITypedSheetRefsLoadedEvent = {
  type: 'SHEET/refs/loaded';
  payload: ITypedSheetRefsLoaded;
};
export type ITypedSheetRefsLoaded<T = {}> = ITypedSheetRefsLoading<T>;

/**
 * Dispatches a change to a cell's data.
 */
export type ITypedSheetChangeEvent = {
  type: 'SHEET/change';
  payload: t.ITypedSheetChange;
};

/**
 * Fired after a change update has completed.
 */
export type ITypedSheetChangedEvent = {
  type: 'SHEET/changed';
  payload: t.ITypedSheetChanged;
};
export type ITypedSheetChanged = {
  sheet: t.ITypedSheet;
  change: t.ITypedSheetChangeDiff;
  changes: t.ITypedSheetChanges;
};

/**
 * Fires when a set of changes are reverted.
 */
export type ITypedSheetChangesClearedEvent = {
  type: 'SHEET/changes/cleared';
  payload: t.ITypedSheetChangesCleared;
};
export type ITypedSheetChangesCleared = {
  sheet: t.ITypedSheet;
  from: t.ITypedSheetChanges;
  to: t.ITypedSheetChanges;
  action: 'REVERT' | 'SAVE';
};

/**
 * Fires a set of changes that may have changed in a different process
 * allowing any sheets/chaches (etc) to synchronize themselves.
 */
export type ITypedSheetSyncEvent = {
  type: 'SHEET/sync';
  payload: ITypedSheetSync;
};
export type ITypedSheetSync = {
  ns: string;
  changes: t.ITypedSheetChanges;
};
