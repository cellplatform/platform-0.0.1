import { Observable } from 'rxjs';

export type IProps<T = any> = { [P in keyof T]: T[P] };
export type IObservableProps<P = any> = IProps<P> & {
  readonly $: {
    readonly dispose$: Observable<{}>;
    readonly events$: Observable<PropEvent>;
    readonly getting$: Observable<IPropGetting<P>>;
    readonly get$: Observable<IPropGet<P>>;
    readonly setting$: Observable<IPropSetting<P>>;
    readonly set$: Observable<IPropSet<P>>;
  };
  readonly changed$: Observable<IPropChanged<P>>;
  readonly isDisposed: boolean;
  dispose(): void;
  toObject(): IProps<P>;
};

/**
 * [Events]
 */
export type PropEvent = IPropGettingEvent | IPropGetEvent | IPropSettingEvent | IPropSetEvent;

export type IPropGettingEvent<P extends IProps = any> = {
  type: 'PROP/getting';
  payload: IPropGetting<P>;
};
export type IPropGetting<P extends IProps = any> = {
  key: keyof P;
  value: P[keyof P];
  isModified: boolean;
  modify(value: P[keyof P]): void;
};

export type IPropGetEvent<P extends IProps = any> = {
  type: 'PROP/get';
  payload: IPropGet<P>;
};
export type IPropGet<P extends IProps = any> = {
  key: keyof P;
  value: P[keyof P];
};

export type IPropSettingEvent<P extends IProps = any> = {
  type: 'PROP/setting';
  payload: IPropSetting<P>;
};
export type IPropSetting<P extends IProps = any> = {
  key: keyof P;
  value: { from: P[keyof P]; to: P[keyof P] };
  isCancelled: boolean;
  cancel(): void;
};

export type IPropSetEvent<P extends IProps = any> = {
  type: 'PROP/set';
  payload: IPropSet<P>;
};
export type IPropSet<P extends IProps = any> = {
  key: keyof P;
  value: { from: P[keyof P]; to: P[keyof P] };
};

export type IPropChanged<P extends IProps = any> = IPropSet<P>;
