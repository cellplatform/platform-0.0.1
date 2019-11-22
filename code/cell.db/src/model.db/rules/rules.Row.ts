import { t, Schema } from '../../common';

/**
 * Invoked before a [Row] is persisted to the DB.
 */
export const beforeRowSave: t.BeforeModelSave<t.IDbModelRowProps> = async args => {
  const { changes } = args;
  const model = args.model as t.IDbModelRow;
};
