import { t } from '../common';

/**
 * Item types.
 */
export type ActionItem = {
  kind: string; // Type of action tag.
  id: string; //   Unique ID.
};

// TEMP 🐷
export type ActionItemInput = t.ActionButton | t.ActionBoolean | t.ActionSelect;
