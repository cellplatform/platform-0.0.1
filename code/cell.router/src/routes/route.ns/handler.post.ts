import { defaultValue, func, models, Schema, t, Squash } from '../common';
import { getNs } from './handler.get';
import * as util from './util';

export async function postNs(args: {
  db: t.IDb;
  fs: t.FsDriver;
  id: string;
  body: t.IReqPostNsBody;
  query: t.IReqQueryNsWrite;
  host: string;
}) {
  try {
    const { db, fs, id, query, host } = args;

    const onConflict = ['merge', 'overwrite'].includes(query.onConflict ?? '')
      ? query.onConflict
      : 'merge'; // Simple "merge" (least-destructive) by default.

    const uri = Schema.Uri.create.ns(id);
    const ns = await models.Ns.create({ db, uri }).ready;
    let body = { ...args.body };

    const changes: t.IDbModelChange[] = [];
    let isNsChanged = false;

    // Calculation REFs and functions.
    const calc = util.formatQuery(body.calc);
    if (calc) {
      const calculate = func.calc({ host, ns, cells: body.cells });
      const range = typeof calc === 'string' ? calc : undefined;
      const res = await calculate.changes({ range });
      body = { ...body, cells: { ...(body.cells || {}), ...res.map } };
    }

    // Data persistence.
    const saveChildData = async (body: t.IReqPostNsBody) => {
      const { cells, rows, columns } = body;
      if (cells || rows || columns) {
        const data = { cells, rows, columns };
        const res = await models.ns.setChildData({ ns, data, onConflict });
        res.changes.forEach((change) => changes.push(change));
      }
    };

    const saveNsData = async (body: t.IReqPostNsBody) => {
      const res = await models.ns.setProps({ ns, data: body.ns });
      if (res.isChanged) {
        isNsChanged = true;
        res.changes.forEach((change) => changes.push(change));
      }
    };

    await saveChildData(body);
    await saveNsData(body);

    // Ensure timestamp and hash are updated if the namespace was
    // not directly updated (ie. cells/rows/columns only changed).
    if (!isNsChanged && changes.length > 0) {
      const res = await ns.save({ force: true });
      if (res.isChanged) {
        models.toChanges(uri, res.changes).forEach((change) => changes.push(change));
      }
    }

    // Retrieve NS data.
    const res = (await getNs({ db, fs, id, query, host })) as t.IPayload<t.IResGetNs>;
    if (util.isErrorPayload(res)) {
      return res;
    }

    // Finish up.
    const data: t.IResPostNs = {
      ...res.data,
      changes: defaultValue(query.changes, true) ? changes : undefined, // NB: don't send if suppressed in query-string (?changes=false)
    };
    return { status: res.status, data };
  } catch (err) {
    return util.toErrorPayload(err);
  }
}
