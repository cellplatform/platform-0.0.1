import { Observable } from 'rxjs';
import { JsonMap } from '@platform/types';

/**
 * [Client]
 * An abstract representation of the configuration settings
 * that works on either the [main] or [renderer] processes.
 */
export type ISettingsClient<T extends SettingsJson = any> = {
  change$: Observable<ISettingsChange<T>>;

  read: (...keys: (keyof T)[]) => Promise<Partial<T>>;
  write: (...values: ISettingsKeyValue<T>[]) => Promise<ISettingsSetValuesResponse>;

  keys: () => Promise<(keyof T)[]>;
  get: <K extends keyof T>(key: K, defaultValue?: T[K]) => Promise<T[K]>;
  put: <K extends keyof T>(key: K, value: T[K]) => Promise<T[K]>;
  delete: <K extends keyof T>(...keys: (keyof T)[]) => Promise<void>;
  clear: () => Promise<void>;
  openInEditor: () => ISettingsClient<T>;
  openFolder: () => ISettingsClient<T>;
  namespace(namespace: string): ISettingsClient<T>;
};

export type ISettingsKeyValue<T extends SettingsJson = any> = {
  key: keyof T;
  value: T[keyof T] | undefined;
};

export type SettingsJson = JsonMap;

export type ISettingsFile = {
  version: number;
  body: SettingsJson;
};

/**
 * The settings client with extended [main] properties.
 */
export type IMainSettingsClient<T extends SettingsJson = any> = ISettingsClient<T> & {
  path: string;
};

/**
 * [Deletages]
 */
export type SettingsSetAction = 'UPDATE' | 'DELETE';

export type GetSettingsValues<T extends SettingsJson> = (
  keys: (keyof T)[],
) => Promise<SettingsJson>;

export type SetSettingsValues<T extends SettingsJson> = (
  keys: ISettingsKeyValue<T>[],
  action: SettingsSetAction,
) => Promise<ISettingsSetValuesResponse>;

export type GetSettingsKeys<T extends SettingsJson> = () => Promise<(keyof T)[]>;

export type OpenSettings = () => void;

/**
 * [Events].
 */
export type SettingsEvent =
  | ISettingsChangeEvent
  | ISettingsGetKeysEvent
  | ISettingsGetValuesEvent
  | ISettingsSetValuesEvent
  | ISettingsOpenEvent;

export type ISettingsChangeEvent<T extends SettingsJson = any> = {
  type: '@platform/SETTINGS/change';
  payload: ISettingsChange<T>;
};
export type ISettingsChange<T extends SettingsJson = any> = {
  keys: (keyof T)[];
  values: T;
  action: SettingsSetAction;
};

export type ISettingsGetKeysEvent = {
  type: '@platform/SETTINGS/keys';
  payload: Record<string, undefined>; // NB: Placeholder {object}.
};

export type ISettingsGetValuesEvent = {
  type: '@platform/SETTINGS/get';
  payload: { keys: string[] };
};
export type ISettingsGetValuesResponse = {
  ok: boolean;
  exists: boolean;
  version: number;
  body: SettingsJson;
  error?: string;
};

export type ISettingsSetValuesEvent = {
  type: '@platform/SETTINGS/set';
  payload: { values: ISettingsKeyValue[]; action: SettingsSetAction };
};
export type ISettingsSetValuesResponse<T extends SettingsJson = any> = {
  ok: boolean;
  error?: string;
};

export type ISettingsOpenEvent = {
  type: '@platform/SETTINGS/open';
  payload: { target: 'EDITOR' | 'FOLDER' };
};
