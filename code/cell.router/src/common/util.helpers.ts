import * as mime from 'mime-types';
import { time } from './libs';

/**
 * Determine if the status code represents an OK status (200).
 */
export function isOK(status: number | string = 200) {
  return status.toString().startsWith('2');
}

/**
 * Determines if the given string is an HTTP link.
 */
export function isHttp(input = '') {
  input = input.trimLeft();
  return input.startsWith('https://') || input.startsWith('http://');
}

/**
 * Determines if the given string is a FILE link.
 */
export function isFile(input = '') {
  return input.trimLeft().startsWith('file://');
}

/**
 * Get the mime-type for the given filename.
 * Derived from extension.
 */
export function toMimetype(filename = '') {
  const type = mime.lookup((filename || '').trim());
  return typeof type === 'string' ? type : undefined;
}

/**
 * Converts to seconds.
 */
export function toSeconds(input?: number | string, defaultSeconds?: number) {
  const done = (sec?: number) => {
    return sec === undefined ? undefined : sec < 0 ? undefined : sec;
  };
  if (input === undefined) {
    return done(defaultSeconds);
  } else {
    return typeof input === 'number' ? done(input) : done(time.duration(input).sec);
  }
}
