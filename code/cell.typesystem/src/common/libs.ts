import { uniq, prop, sortBy } from 'ramda';
export const R = { prop, uniq, sortBy };

export { MemoryCache } from '@platform/cache';

export { Schema, Uri, squash, RefLinks } from '@platform/cell.schema';
export { coord } from '@platform/cell.coord';

import { value } from '@platform/util.value';
export { value };
export const deleteUndefined = value.deleteUndefined;
export const defaultValue = value.defaultValue;
