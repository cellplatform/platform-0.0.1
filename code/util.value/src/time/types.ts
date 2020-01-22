import { Dayjs, ConfigType } from 'dayjs';

import { IDuration, TimeUnit } from '@platform/types';
export { IDuration, TimeUnit };

export type TimeDelay<T = any> = (msecs: number, callback?: () => T) => TimeDelayPromise<T>;
export type TimeDelayPromise<T = any> = Promise<T> & {
  id: NodeJS.Timeout;
  isCancelled: boolean;
  cancel(): void;
  result: T | undefined;
};

export type TimeWait = (msecs: number) => Promise<{}>;
export type TimeElapsed = (
  from: DateInput,
  options?: { to?: DateInput; round?: number },
) => IDuration;
export type DayFactory = (config?: ConfigType) => Dayjs;

export type DateInput = number | string | Date | Dayjs;

export type ITime = {
  delay: TimeDelay;
  wait: TimeWait;
  elapsed: TimeElapsed;
  day: DayFactory;
  now: IDate;
  utc(input?: Date | number): IDate;
  timer(start?: Date, options?: { round?: number }): ITimer;
  duration(msec: number, options?: { round?: number }): IDuration;
};

export type IDate = {
  date: Date;
  timestamp: number;
  unix: number;
  format(template?: string): string;
};

export type ITimer = {
  startedAt: Date;
  reset: () => ITimer;
  elapsed: IDuration;
};
