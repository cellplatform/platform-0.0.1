import { fromEvent as rxFromEvent, Observable, Subject } from 'rxjs';
import { HasEventTargetAddRemove } from 'rxjs/dist/types/internal/observable/fromEvent';
import { share } from 'rxjs/operators';

import { is } from '@platform/util.is';

/**
 * Create observable from event.
 */
export const fromEvent = <T>(
  source: HasEventTargetAddRemove<any> | undefined,
  event: string,
): Observable<T> => {
  return source ? rxFromEvent(source, event).pipe(share()) : new Subject<any>().pipe(share()); // NB: Safe when server-rendered.
};

/**
 * Create from document event.
 */
export const fromDocumentEvent = <T>(event: string): Observable<T> =>
  fromEvent(is.browser ? document : undefined, event);

/**
 * Create from window event.
 */
export const fromWindowEvent = <T>(event: string): Observable<T> =>
  fromEvent(is.browser ? window : undefined, event);
