/**
 * Ramda
 */
import { equals, uniq, clamp, mergeDeepRight } from 'ramda';
export const R = { equals, uniq, clamp, mergeDeepRight };

/**
 * @platform
 */
export { rx } from '@platform/util.value';
export { log } from '@platform/log/lib/client';
export { css, color, CssValue, formatColor, Style } from '@platform/css';
export { WebRuntime } from '@platform/cell.runtime.web';
export {
  Mouse,
  useResizeObserver,
  useEventListener,
  drag,
  copyToClipboard,
  FC,
} from '@platform/react';
export { defaultValue, time, slug, deleteUndefined, value } from '@platform/util.value';
export { HttpClient } from '@platform/cell.client';
export { ObjectView } from '@platform/ui.object';
