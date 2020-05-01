import { Observable } from 'rxjs';

export type QueueHandler<T> = () => Promise<T>;

export type IMemoryQueue = {
  readonly id: string;
  readonly length: number;
  readonly isEnabled: boolean;
  readonly isDisposed: boolean;
  readonly dispose$: Observable<{}>;
  readonly event$: Observable<QueueEvent>;
  dispose(): void;
  push<T>(handler: QueueHandler<T>): QueueItem<T>;
  start(): IMemoryQueue;
  stop(): IMemoryQueue;
};

export type QueueItem<T = any> = Promise<T> & {
  readonly id: string;
  readonly isDone: boolean;
  readonly elapsed: number; // msecs.
  readonly result?: T;
  readonly error?: Error;
  readonly event$: Observable<QueueItemEvent>;
  readonly done$: Observable<IQueueItemDone>;
};

/**
 * Events
 */

export type QueueEvent = IQueuePushedEvent | IQueueStatusEvent | QueueItemEvent;
export type QueueItemEvent = IQueueItemStartEvent | IQueueItemDoneEvent;

export type IQueuePushedEvent = {
  type: 'QUEUE/pushed';
  payload: IQueuePushed;
};
export type IQueuePushed = { id: string; isEnabled: boolean };

export type IQueueStatusEvent = {
  type: 'QUEUE/status';
  payload: IQueueStatus;
};
export type IQueueStatus = { id: string; isEnabled: boolean; length: number };

/**
 * Event: item processing
 */

export type IQueueItemStartEvent = {
  type: 'QUEUE/item/start';
  payload: IQueueItemStart;
};
export type IQueueItemStart = { id: string };

export type IQueueItemDoneEvent<T = any> = {
  type: 'QUEUE/item/done';
  payload: IQueueItemDone<T>;
};
export type IQueueItemDone<T = any> = {
  id: string;
  elapsed: number; // msecs
  result?: T;
  error?: Error;
};
