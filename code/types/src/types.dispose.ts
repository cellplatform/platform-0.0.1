import { Observable } from 'rxjs';

export type IDisposable = {
  readonly isDisposed: boolean;
  readonly dispose$: Observable<void>;
  dispose(): void;
};
