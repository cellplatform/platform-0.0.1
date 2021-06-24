/* eslint-disable */

import { t, expect, getTestDb, value, time } from '../test';
import { models } from '..';
import {
  getChildRows,
  setChildData,
  setChildCells,
  getChildCells,
  getChildColumns,
  getChildData,
  getChildFiles,
} from './model.ns';

type P = t.ICellProps;
type R = t.IRowProps & { grid: { height?: number } };
type C = t.IRowProps & { grid: { width?: number } };

const { deleteUndefined } = value;

describe('helpers: model.ns', () => {
  it('toSchema', async () => {
    const db = await getTestDb({});
    const test = (input: t.IDbModelNs | string) => {
      const res = models.ns.toSchema(input);
      expect(res.uri).to.eql('ns:foo');
      expect(res.path).to.eql('NS/foo');
      expect(res.parts.type).to.eql('NS');
      expect(res.parts.id).to.eql('foo');
    };
    test('ns:foo');
    test('NS/foo');
    test('foo');
    test(models.Ns.create({ uri: 'ns:foo', db }));
  });

  it('toId', async () => {
    const db = await getTestDb({});
    const test = (input: t.IDbModelNs | string) => {
      const res = models.ns.toId(input);
      expect(res).to.eql('foo');
    };
    test('ns:foo');
    test('NS/foo');
    test('foo');
    test(models.Ns.create({ uri: 'ns:foo', db }));
  });

  describe('setProps', () => {
    it('setProps', async () => {
      const db = await getTestDb({});
      const ns = models.Ns.create({ uri: 'ns:foo', db });
      expect(ns.props.hash).to.eql(undefined);

      const res1 = await models.ns.setProps({ ns }); // NB: no change.
      expect(res1.changes).to.eql([]);
      expect(ns.props.hash).to.eql(undefined);

      const res2 = await models.ns.setProps({ ns, data: { title: 'MySheet' } });
      const hash = ns.props.hash;
      expect(res2.changes.map((c) => c.field)).to.eql(['props', 'id', 'props', 'hash']);
      expect(hash).to.not.eql(undefined);
      expect(ns.props.props && ns.props.props.title).to.eql('MySheet');

      const change = res2.changes[0];
      expect(change.uri).to.eql('ns:foo');
      expect(change.field).to.eql('props');
      expect(change.from).to.eql(undefined);
      expect(change.to).to.eql({ title: 'MySheet' });

      const res3 = await models.ns.setProps({ ns, data: { title: 'Foo' } });
      expect(res3.changes.map((c) => c.field)).to.eql(['props', 'hash']);
      expect(ns.props.hash).to.not.eql(hash);
      expect(ns.props.props && ns.props.props.title).to.eql('Foo');

      const res4 = await models.ns.setProps({ ns, data: { title: undefined } });
      expect(res4.changes.map((c) => c.field)).to.eql(['props', 'hash']);
      expect(ns.props.props && ns.props.props.title).to.eql(undefined);
    });

    it('setProps: merge-overwrites retaining existing values', async () => {
      const db = await getTestDb({});
      const ns = models.Ns.create({ uri: 'ns:foo', db });

      const res0 = ns.toObject();
      expect(res0.props).to.eql(undefined);

      await models.ns.setProps({ ns, data: { foo: 123 } as any });
      const res1 = ns.toObject().props as any;
      expect(res1.foo).to.eql(123);
      expect(res1.bar).to.eql(undefined);

      await models.ns.setProps({ ns, data: { bar: 456, foo: 999 } as any });
      const res2 = ns.toObject().props as any;
      expect(res2.foo).to.eql(999);
      expect(res2.bar).to.eql(456);
    });
  });

  describe('setChildData', () => {
    it('return change set (un-changed values not reported)', async () => {
      const db = await getTestDb({});
      const ns = models.Ns.create({ uri: 'ns:foo', db });

      const res1 = await setChildData({ ns, data: { cells: { A1: { value: '=A2' } } } });

      expect(res1.changes.length).to.eql(2);
      expect(res1.changes.map((c) => c.field)).to.eql(['value', 'hash']);

      // NB: Change A1 "props", but "value" remains unchanged.
      const res2 = await setChildData({
        ns,
        data: { cells: { A1: { value: '=A2', props: { value: 'hello' } } } },
      });

      expect(res2.changes.length).to.eql(2); // NB: not 3, as the "value" field has not changed ("=A2").
      expect(res2.changes.map((c) => c.field)).to.eql(['props', 'hash']);
    });

    it('overwrite data', async () => {
      const db = await getTestDb({});
      const ns = models.Ns.create({ uri: 'ns:foo', db });
      const read = async () => await getChildCells({ model: ns });

      await setChildData({
        ns,
        data: {
          cells: { A1: { value: '=A3', props: { foo: 123 } as any, links: { foo: 'bar' } } },
        },
      });

      const res1 = await read();
      expect(res1.A1?.value).to.eql('=A3');
      expect(res1.A1?.props).to.eql({ foo: 123 });
      expect(res1.A1?.links).to.eql({ foo: 'bar' });

      await setChildData({
        update: 'overwrite',
        ns,
        data: {
          cells: { A1: { value: 'hello', props: { bar: 456 } as any, links: { zoo: 'hello' } } },
        },
      });
      await ns.save();

      const res2 = await read();
      expect(res2.A1?.value).to.eql('hello');
      expect(res2.A1?.props).to.eql({ bar: 456 }); // NB: Replaced ("foo" key removed)
      expect(res2.A1?.links).to.eql({ zoo: 'hello' });
    });

    it('merge data (default)', async () => {
      const db = await getTestDb({});
      const ns = models.Ns.create({ uri: 'ns:foo', db });
      const read = async () => await getChildCells({ model: ns });

      await setChildData({
        ns,
        data: {
          cells: {
            A1: {
              value: '=A3',
              props: { foo: 123, child: { msg: 'one' } } as any,
              links: { foo: 'bar' },
            },
          },
        },
      });

      const res1 = await read();
      expect(res1.A1?.value).to.eql('=A3');
      expect(res1.A1?.props).to.eql({ foo: 123, child: { msg: 'one' } });
      expect(res1.A1?.links).to.eql({ foo: 'bar' });

      await setChildData({
        // update: 'merge', // NB: Merge is default value
        ns,
        data: {
          cells: {
            A1: {
              value: 'hello',
              props: { bar: 456, child: { count: 1 } } as any,
              links: { zoo: 'hello' },
            },
          },
        },
      });
      await ns.save();

      const res2 = await read();
      expect(res2.A1?.value).to.eql('hello');
      expect(res2.A1?.props).to.eql({ foo: 123, bar: 456, child: { msg: 'one', count: 1 } }); // NB: Objects are merged.
      expect(res2.A1?.links).to.eql({ zoo: 'hello', foo: 'bar' });
    });

    it('sets error, then clear error', async () => {
      const error = { type: 'FOO', message: 'Boo' };
      const db = await getTestDb({});
      const ns = models.Ns.create({ uri: 'ns:foo', db });

      const getCells = async () => {
        await ns.load({ force: true });
        return getChildCells({ model: ns });
      };
      const getA1 = async () => ((await getCells()) || {}).A1 || {};

      expect(await getCells()).to.eql({});
      await setChildData({ ns, data: { cells: { A1: { value: 123 } } } });

      expect((await getA1()).value).to.eql(123);
      expect((await getA1()).error).to.eql(undefined);

      await setChildData({ ns, data: { cells: { A1: { error } } } });
      expect((await getA1()).value).to.eql(123);
      expect((await getA1()).error).to.eql(error);

      await setChildData({ ns, data: { cells: { A1: {} } } }); // NB: Error not removed because not explicitly set to [undefined].
      expect((await getA1()).value).to.eql(123);
      expect((await getA1()).error).to.eql(error);

      await setChildData({ ns, data: { cells: { A1: { error: undefined } } } });
      expect((await getA1()).value).to.eql(123);
      expect((await getA1()).error).to.eql(undefined); // NB: Error gone.
    });
  });

  describe('setChildCells', () => {
    it('sets error, then clear error', async () => {
      const error = { type: 'FOO', message: 'Boo' };
      const db = await getTestDb({});
      const ns = models.Ns.create({ uri: 'ns:foo', db });

      const getCells = async () => {
        await ns.load({ force: true });
        return getChildCells({ model: ns });
      };
      const getA1 = async () => ((await getCells()) || {}).A1 || {};

      expect(await getCells()).to.eql({});
      await setChildCells({ ns, data: { A1: { value: 123 } } });

      expect((await getA1()).value).to.eql(123);
      expect((await getA1()).error).to.eql(undefined);

      await setChildCells({ ns, data: { A1: { error } } });
      expect((await getA1()).value).to.eql(123);
      expect((await getA1()).error).to.eql(error);

      await setChildCells({ ns, data: { A1: { error: undefined } } });
      expect((await getA1()).value).to.eql(123);
      expect((await getA1()).error).to.eql(undefined); // NB: Error gone.
    });
  });

  describe('get (namespace child data)', () => {
    it('getChildCells (with links)', async () => {
      const db = await getTestDb({});
      const ns = models.Ns.create({ uri: 'ns:foo', db });

      const cell = models.Cell.create({ uri: 'cell:foo:A1', db });
      await cell.set({ value: 123, links: { 'fs:foo:wasm': 'file:abc.123' } }).save();

      const cells = await getChildCells({ model: ns });
      const A1 = cells.A1 || {};

      expect(A1.value).to.eql(123);
      expect(A1.links).to.eql({ 'fs:foo:wasm': 'file:abc.123' });
    });

    it('getChildRows', async () => {
      const db = await getTestDb({});
      const ns = models.Ns.create({ uri: 'ns:foo', db });

      const row = models.Row.create<R>({ uri: 'cell:foo:1', db });
      await row.set({ props: { grid: { height: 250 } } }).save();

      const rows = await getChildRows({ model: ns });
      expect(rows['1']).to.eql(deleteUndefined(row.toObject()));
    });

    it('getChildColumns', async () => {
      const db = await getTestDb({});
      const ns = models.Ns.create({ uri: 'ns:foo', db });

      const column = models.Column.create<C>({ uri: 'cell:foo:A', db });
      await column.set({ props: { grid: { width: 250 } } }).save();

      const columns = await getChildColumns({ model: ns });
      expect(columns.A).to.eql(deleteUndefined(column.toObject()));
    });

    it('getChildFiles', async () => {
      const db = await getTestDb({});
      const ns = models.Ns.create({ uri: 'ns:foo', db });

      const file = models.File.create({ uri: 'file:foo:abc', db });
      await file.set({ props: { mimetype: 'image/png' } }).save();

      const files = await getChildFiles({ model: ns });
      expect(files.abc).to.eql(deleteUndefined(file.toObject()));
    });

    it('getChildData', async () => {
      const db = await getTestDb({});
      const ns = models.Ns.create({ uri: 'ns:foo', db });

      const A1 = models.Cell.create({ uri: 'cell:foo:A1', db });
      await A1.set({ value: 123, links: { 'fs:foo:wasm': 'file:abc.123' } }).save();

      const row = models.Row.create<R>({ uri: 'cell:foo:1', db });
      await row.set({ props: { grid: { height: 250 } } }).save();

      const column = models.Column.create<C>({ uri: 'cell:foo:A', db });
      await column.set({ props: { grid: { width: 250 } } }).save();

      const file1 = models.File.create({ uri: 'file:foo:abc', db });
      await file1.set({ props: { mimetype: 'image/png' } }).save();

      const res1 = await getChildData({ model: ns });
      expect(res1.data).to.eql({});
      expect(res1.totals).to.eql({});

      const res2 = await getChildData({ model: ns, cells: true });
      expect(res2.data).to.eql({
        cells: { A1: deleteUndefined(A1.toObject()) },
      });
      expect(res2.totals).to.eql({});

      const res3 = await getChildData({
        model: ns,
        cells: true,
        rows: true,
        columns: true,
        files: true,
      });
      expect(res3.data).to.eql({
        cells: { A1: deleteUndefined(A1.toObject()) },
        rows: { '1': deleteUndefined(row.toObject()) },
        columns: { A: deleteUndefined(column.toObject()) },
        files: { abc: deleteUndefined(file1.toObject()) },
      });

      const res4 = await getChildData({ model: ns, total: 'files' });
      expect(res4.data).to.eql({});
      expect(res4.totals).to.eql({ files: 1 });

      // Add another file.
      const file2 = models.File.create({ uri: 'file:foo:def', db });
      await file2.set({ props: { mimetype: 'image/png' } }).save();
      await ns.load({ force: true });

      const res5 = await getChildData({ model: ns, files: true, total: ['files'] });
      expect(res5.data).to.eql({
        files: {
          abc: deleteUndefined(file1.toObject()),
          def: deleteUndefined(file2.toObject()),
        },
      });
      expect(res5.totals).to.eql({ files: 2 });

      const res6 = await getChildData({ model: ns, total: 'rows' });
      expect(res6.data).to.eql({});
      expect(res6.totals.cells).to.eql(1);
      expect(res6.totals.rows).to.eql(1);
      expect(res6.totals.columns).to.eql(undefined);

      // Add another cell (Z9), thereby expanding the number of rows.
      const Z9 = models.Cell.create({ uri: 'cell:foo:Z9', db });
      await Z9.set({ value: 123, links: { 'fs:foo:wasm': 'file:abc.123' } }).save();
      await ns.load({ force: true });

      const res7 = await getChildData({ model: ns, total: ['rows', 'columns'] });
      expect(res7.data).to.eql({});
      expect(res7.totals.cells).to.eql(2);
      expect(res7.totals.rows).to.eql(9); //      NB: 9 of "Z9"
      expect(res7.totals.columns).to.eql(26); //  NB: Z of "Z9"
    });
  });
});
