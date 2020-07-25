import { Observable } from 'rxjs';
import * as t from '../common/types';

type O = Record<string, unknown>;
type Event = t.Event<any>;
type MergeObject = { [key: string]: Record<string, unknown> };

/**
 * Static entry point.
 */
export type StateObject = {
  create<T extends O, E extends Event = any>(initial: T): IStateObjectWritable<T, E>;

  readonly<T extends O, E extends Event = any>(
    obj: IStateObjectWritable<T, E> | IStateObjectDispatchable<T, E> | IStateObjectReadOnly<T, E>,
  ): IStateObjectReadOnly<T, E>;

  dispatchable<T extends O, E extends Event = any>(
    obj: IStateObjectWritable<T, E> | IStateObjectDispatchable<T, E>,
  ): IStateObjectDispatchable<T, E>;

  merge<T extends MergeObject, E extends Event = any>(
    initial: T | Record<keyof T, t.IStateObject<T[keyof T]>>,
    dispose$?: Observable<any>,
  ): StateObjectMerger<T, E>;
};

/**
 * Read-only.
 */
export type IStateObject<T extends O, E extends Event = any> = IStateObjectReadOnly<T, E>;
export type IStateObjectReadOnly<T extends O, E extends Event = any> = {
  readonly original: T;
  readonly state: T;
  readonly event: IStateObjectEvents<T, E>;
  readonly isDisposed: boolean;
};

export type IStateObjectDispatchable<T extends O, E extends Event = any> = IStateObjectReadOnly<
  T,
  E
> & {
  dispatch(event: E): void;
  action(takeUntil$?: Observable<any>): IStateObjectAction<T, E>;
};

export type IStateObjectEvents<T extends O, E extends Event = any> = {
  readonly $: Observable<StateObjectEvent>;
  readonly changing$: Observable<IStateObjectChanging<T>>;
  readonly changed$: Observable<IStateObjectChanged<T, E>>;
  readonly cancelled$: Observable<IStateObjectCancelled<T>>;
  readonly dispatch$: Observable<E>;
  readonly dispose$: Observable<any>;
};

export type IStateObjectAction<T extends O, E extends Event> = {
  dispatched(action: E['type']): Observable<E['payload']>;
  changed(action: E['type']): Observable<IStateObjectChanged<T, E>>;
};

/**
 * Writeable.
 */
export type IStateObjectWritable<T extends O, E extends Event = any> = IStateObjectDispatchable<
  T,
  E
> &
  t.IDisposable & {
    readonly readonly: IStateObject<T, E>;
    readonly dispatchable: IStateObjectDispatchable<T, E>;
    change(input: StateObjectChanger<T> | T, action?: E['type']): IStateObjectChangeResponse<T>;
  };

export type StateObjectChangeOperation = 'update' | 'replace';

export type IStateObjectChangeResponse<T extends O, E extends Event = any> = {
  op: StateObjectChangeOperation;
  cid: string; // "change-id"
  patches: t.PatchSet;
  changed?: IStateObjectChanged<T, E>;
  cancelled?: IStateObjectCancelled<T>;
};
export type StateObjectChanger<T extends O> = (draft: T) => void;

/**
 * Merge
 */

export type StateObjectMerge<T extends MergeObject, E extends Event = any> = (
  initial: T,
) => StateObjectMerger<T, E>;

export type StateObjectMerger<T extends MergeObject, E extends Event = any> = {
  readonly store: t.IStateObjectReadOnly<T, E>;
  readonly state: T;
  readonly changed$: Observable<t.IStateObjectChanged>;
  add<K extends keyof T>(
    key: K,
    subject: t.IStateObject<T[K]> | Observable<t.IStateObjectChanged>,
  ): StateObjectMerger<T, E>;
  dispose(): void;
};

/**
 * [Events]
 */
export type StateObjectEvent =
  | IStateObjectChangingEvent
  | IStateObjectChangedEvent
  | IStateObjectCancelledEvent
  | IStateObjectDispatchEvent
  | IStateObjectDisposedEvent;

/**
 * Fires before the state object is updated
 * (after a `change` method completes).
 */
export type IStateObjectChangingEvent<T extends O = any, E extends Event = any> = {
  type: 'StateObject/changing';
  payload: IStateObjectChanging<T, E>;
};
export type IStateObjectChanging<T extends O = any, E extends Event = any> = {
  op: StateObjectChangeOperation;
  cid: string; // "change-id"
  from: T;
  to: T;
  patches: t.PatchSet;
  cancelled: boolean;
  cancel(): void;
  action: E['type'];
};

/**
 * Fires AFTER the state object has been updated
 * (ie the "changing" event did not cancel the change).
 */
export type IStateObjectChangedEvent<T extends O = any, E extends Event = any> = {
  type: 'StateObject/changed';
  payload: IStateObjectChanged<T, E>;
};
export type IStateObjectChanged<T extends O = any, E extends Event = any> = {
  op: StateObjectChangeOperation;
  cid: string; // "change-id"
  from: T;
  to: T;
  patches: t.PatchSet;
  action: E['type'];
};

/**
 * Fires when a change is cancelled.
 */
export type IStateObjectCancelledEvent<T extends O = any> = {
  type: 'StateObject/cancelled';
  payload: IStateObjectChanging<T>;
};
export type IStateObjectCancelled<T extends O = any> = IStateObjectChanging<T>;

/**
 * Fires when an event is fired via the `action` method (aka "dispatch").
 */
export type IStateObjectDispatchEvent<E extends Event = any> = {
  type: 'StateObject/dispatch';
  payload: IStateObjectDispatch<E>;
};
export type IStateObjectDispatch<E extends Event = any> = { event: E };

/**
 * Fires when the state object is disposed of.
 */
export type IStateObjectDisposedEvent<T extends O = any> = {
  type: 'StateObject/disposed';
  payload: IStateObjectDisposed<T>;
};
export type IStateObjectDisposed<T extends O = any> = { original: T; final: T };
