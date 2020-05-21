import { Schema, t, util, value } from '../../common';

/**
 * Invoked before a [Column] is persisted to the DB.
 */
export const beforeColumnSave: t.BeforeModelSave<t.IDbModelColumnProps> = async args => {
  const model = args.model as t.IDbModelColumn;

  // Update hash.
  if (args.force || args.isChanged) {
    // console.log('model.path', model.path);
    const uri = Schema.from.column(model.path).uri;
    const data: t.IColumnData = { ...value.deleteUndefined(model.toObject()) };
    delete data.hash;
    model.props.hash = util.hash.column({ uri, data });
  }
};
