import { Observable } from 'rxjs';
import * as t from './common/types';

/**
 * [Model]
 */
export type ModelValueKind = 'PROP' | 'LINK';

export type IModel<
  P extends Record<string, unknown> = any,
  D extends P = P,
  L extends IModelLinksSchema = any,
  C extends IModelChildrenSchema = any
> = IModelProps<P, D, L, C> & IModelMethods<P, D, L, C>;

export type IModelProps<
  P extends Record<string, unknown>,
  D extends P,
  L extends IModelLinksSchema,
  C extends IModelChildrenSchema = any
> = t.IDbTimestamps & {
  readonly path: string;
  readonly isDisposed: boolean;
  readonly isLoaded: boolean;
  readonly isChanged: boolean;
  readonly db: t.IDb;
  readonly exists: boolean | undefined;
  readonly ready: Promise<IModel<P, D, L, C>>;
  readonly changes: IModelChanges<P, D>;
  readonly dispose$: Observable<void>;
  readonly events$: Observable<ModelEvent>;
  readonly doc: D; // Raw DB document.
  readonly props: P; // Data as read|write properties.
  readonly links: IModelLinks<L>; // Relationships (JOINs).
  readonly children: IModelChildren<C>; // Relationships (path descendents).
};
export type IModelMethods<
  P extends Record<string, unknown>,
  D extends P,
  L extends IModelLinksSchema,
  C extends IModelChildrenSchema = any
> = {
  load(options?: { force?: boolean; links?: boolean; silent?: boolean }): Promise<P>;
  reset(): IModel<P, D, L, C>;
  set(props: Partial<P>): IModel<P, D, L, C>;
  beforeSave(options?: { force?: boolean }): Promise<{ payload: IModelSave<P, D, L, C> }>;
  beforeDelete(): Promise<{ payload: IModelDelete<P, D, L, C> }>;
  save(options?: { force?: boolean }): Promise<IModelSaveResponse<P, D, L, C>>;
  delete(): Promise<IModelDeleteResponse>;
  toObject(): P;
};

/**
 * [Save]
 */
export type IModelSaveResponse<
  P extends Record<string, unknown>,
  D extends P,
  L extends IModelLinksSchema, // eslint-disable-line
  C extends IModelChildrenSchema = any // eslint-disable-line
> = {
  saved: boolean;
  isChanged: boolean;
  changes: IModelChanges<P, D>;
};

export type BeforeModelSave<
  P extends Record<string, unknown> = any,
  D extends P = P,
  L extends IModelLinksSchema = any,
  C extends IModelChildrenSchema = any
> = (args: IModelSave<P, D, L, C>) => Promise<any>;

/**
 * [Delete]
 */
export type IModelDeleteResponse = {
  deleted: boolean;
  total: number;
  children: number;
};
export type BeforeModelDelete<
  P extends Record<string, unknown> = any,
  D extends P = P,
  L extends IModelLinksSchema = any,
  C extends IModelChildrenSchema = any
> = (args: IModelDelete<P, D, L, C>) => Promise<any>;

/**
 * [Factory]
 */
export type ModelFactory<M extends IModel = IModel> = (args: ModelFactoryArgs) => M;
export type ModelFactoryArgs = { path: string; db: t.IDb };

/**
 * [Children]
 */
export type IModelChildrenSchema = { [key: string]: IModel[] };
export type IModelChildren<C extends IModelLinksSchema> = { [K in keyof C]: Promise<C[K]> };
export type IModelChildrenDefs<L extends IModelChildrenSchema> = {
  [K in keyof L]: IModelChildrenDef;
};
export type IModelChildrenDef = {
  query: string;
  factory: ModelFactory;
};

/**
 * [Links]
 */
export type IModelLinksSchema = { [key: string]: IModel | IModel[] };

export type IModelLinks<L extends IModelLinksSchema> = { [K in keyof L]: LinkedModelPromise<L, K> };
export type LinkedModelPromise<L extends IModelLinksSchema, K extends keyof L> = L[K] extends IModel
  ? Promise<L[K]> & { link(path: string): void; unlink(): void } // 1:1 relationship.
  : Promise<L[K]> & { link(paths: string[]): void; unlink(paths?: string[]): void }; // 1:* or *:* relationship.

export type ModelLinkRelationship = '1:1' | '1:*';
export type IModelLinkDefs<L extends IModelLinksSchema> = { [K in keyof L]: IModelLinkDef };
export type IModelLinkDef = {
  relationship: ModelLinkRelationship;
  field?: string; // If different from field on the Schema.
  factory: ModelFactory;
};

/**
 * [Changes]
 */
export type IModelChanges<P extends Record<string, unknown>, D extends P> = {
  length: number;
  list: IModelChange<P, D>[];
  map: { [K in keyof D]: D[K] };
};
export type IModelChange<P extends Record<string, unknown>, D extends P> = {
  kind: ModelValueKind;
  path: string;
  field: string;
  value: { from?: any; to?: any };
  doc: { from: D; to: D };
  modifiedAt: number;
  reverted: boolean;
};

/**
 * [Events]
 */
export type ModelEvent =
  | IModelDataLoadedEvent
  | IModelLinkLoadedEvent
  | IModelChildrenLoadedEvent
  | IModelReadPropEvent
  | IModelChangingEvent
  | IModelChangedEvent
  | IModelBeforeSaveEvent
  | IModelSavedEvent
  | IModelBeforeDeleteEvent
  | IModelDeletedEvent;

/**
 * Data loading.
 */
export type IModelDataLoaded = { model: IModel; withLinks: boolean; withChildren: boolean };
export type IModelDataLoadedEvent = {
  type: 'MODEL/loaded/data';
  typename: string;
  payload: IModelDataLoaded;
};

export type IModelLinkLoaded = { model: IModel; field: string };
export type IModelLinkLoadedEvent = {
  type: 'MODEL/loaded/link';
  typename: string;
  payload: IModelLinkLoaded;
};

export type IModelChildrenLoaded = { model: IModel; children: IModel[]; field: string };
export type IModelChildrenLoadedEvent = {
  type: 'MODEL/loaded/children';
  typename: string;
  payload: IModelChildrenLoaded;
};

/**
 * Reading.
 */
export type IModelReadPropEvent<
  P extends Record<string, unknown> = any,
  D extends P = P,
  L extends IModelLinksSchema = any,
  C extends IModelChildrenSchema = any
> = {
  type: 'MODEL/read/prop';
  typename: string;
  payload: IModelReadProp<P, D, L, C>;
};
export type IModelReadProp<
  P extends Record<string, unknown> = any,
  D extends P = P,
  L extends IModelLinksSchema = any,
  C extends IModelChildrenSchema = any
> = {
  model: IModel<P, D, L, C>;
  field: string;
  value?: any;
  doc: D;
  isModified: boolean;
  modify(value: any): void;
};

/**
 * Changes.
 */
export type IModelChangingEvent<P extends Record<string, unknown> = any, D extends P = P> = {
  type: 'MODEL/changing';
  typename: string;
  payload: IModelChanging<P, D>;
};
export type IModelChanging<P extends Record<string, unknown> = any, D extends P = P> = {
  change: IModelChange<P, D>;
  isCancelled: boolean;
  cancel(): void;
};

export type IModelChangedEvent<P extends Record<string, unknown> = any, D extends P = P> = {
  type: 'MODEL/changed';
  typename: string;
  payload: IModelChange<P, D>;
};

/**
 * Save.
 */
export type IModelSave<
  P extends Record<string, unknown> = any,
  D extends P = P,
  L extends IModelLinksSchema = any,
  C extends IModelChildrenSchema = any
> = {
  force: boolean;
  isChanged: boolean;
  isCancelled: boolean;
  model: IModel<P, D, L, C>;
  changes: IModelChanges<P, D>;
  cancel(): void;
};

export type IModelBeforeSaveEvent<
  P extends Record<string, unknown> = any,
  D extends P = P,
  L extends IModelLinksSchema = any,
  C extends IModelChildrenSchema = any
> = {
  type: 'MODEL/beforeSave';
  typename: string;
  payload: IModelSave<P, D, L, C>;
};

export type IModelSavedEvent<
  P extends Record<string, unknown> = any,
  D extends P = P,
  L extends IModelLinksSchema = any,
  C extends IModelChildrenSchema = any
> = {
  type: 'MODEL/saved';
  typename: string;
  payload: IModelSave<P, D, L, C>;
};

/**
 * Save.
 */
export type IModelDelete<
  P extends Record<string, unknown> = any,
  D extends P = P,
  L extends IModelLinksSchema = any,
  C extends IModelChildrenSchema = any
> = {
  model: IModel<P, D, L, C>;
  isCancelled: boolean;
  cancel(): void;
};

export type IModelBeforeDeleteEvent<
  P extends Record<string, unknown> = any,
  D extends P = P,
  L extends IModelLinksSchema = any,
  C extends IModelChildrenSchema = any
> = {
  type: 'MODEL/beforeDelete';
  typename: string;
  payload: IModelDelete<P, D, L, C>;
};

export type IModelDeletedEvent<
  P extends Record<string, unknown> = any,
  D extends P = P,
  L extends IModelLinksSchema = any,
  C extends IModelChildrenSchema = any
> = {
  type: 'MODEL/deleted';
  typename: string;
  payload: IModelDelete<P, D, L, C>;
};
