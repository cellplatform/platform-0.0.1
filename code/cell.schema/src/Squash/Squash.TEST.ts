import { expect } from '../test';
import { t } from '../common';
import { Squash } from '.';

type P = t.ICellProps & {
  style: { bold?: boolean; italic?: boolean; underline?: boolean };
  status: { error?: { message: string } };
  merge?: { colspan?: number; rowspan?: number };
};

type R = t.IRowProps & { grid?: { height?: number } };
type C = t.IColumnProps & { grid?: { width?: number } };

describe('Squash', () => {
  it('Squash.props (cell)', () => {
    const test = (props?: Partial<P>, expected?: any) => {
      const res = Squash.props(props);
      expect(res).to.eql(expected);
    };
    test();
    test({});
    test({ style: {} });
    test({ merge: {} });
    test({ style: {}, merge: {} });
    test({ style: { bold: true }, merge: {} }, { style: { bold: true } });
  });

  it('Squash.props (row)', () => {
    const test = (props?: Partial<R>, expected?: any) => {
      const res = Squash.props(props);
      expect(res).to.eql(expected);
    };
    test();
    test({});
    test({ grid: undefined });
    test({ grid: {} });
    test({ grid: { height: 0 } }, { grid: { height: 0 } });
    test({ grid: { height: 123 } }, { grid: { height: 123 } });
    test({ foo: null } as any, { foo: null }); // NB: [null] values retained (not the same as [undefined]).
  });

  it('Squash.props (column)', () => {
    const test = (props?: Partial<C>, expected?: any) => {
      const res = Squash.props(props);
      expect(res).to.eql(expected);
    };
    test();
    test({});
    test({ grid: undefined });
    test({ grid: {} });
    test({ grid: { width: 0 } }, { grid: { width: 0 } });
    test({ grid: { width: 123 } }, { grid: { width: 123 } });
    test({ foo: null } as any, { foo: null }); // NB: [null] values retained (not the same as [undefined]).
  });

  it('squash.cell', () => {
    const test = (cell?: t.ICellData, expected?: any, empty?: any) => {
      const res = Squash.cell(cell, { empty });
      expect(res).to.eql(expected);
    };
    test();
    test({});
    test({ value: undefined });
    test({ value: 123 }, { value: 123 });
    test({ value: 123, links: {} }, { value: 123 });
    test({ value: 0, links: {} }, { value: 0 });
    test({ hash: 'sha256...' }); // NB: Hash ignored on empty object.
    test({ value: 123, hash: 'sha256...' }, { value: 123, hash: 'sha256...' });
    test(
      { value: undefined, error: { type: 'UNKNOWN', message: 'Fail' } },
      { error: { type: 'UNKNOWN', message: 'Fail' } },
    );

    test({ value: undefined }, {}, {}); // NB: Squash to {} not undefined.
    test({ value: null }, { value: null }); // NB: [null] values retained (not the same as [undefined]).
  });

  it('squash.object', () => {
    const test = (
      obj?: Record<string, unknown>,
      expected?: any,
      options?: { empty?: Record<string, unknown> },
    ) => {
      const res = Squash.object(obj, options);
      expect(res).to.eql(expected);
    };
    test();
    test({});
    test({ hash: 'sha256...' }); // NB: Hash ignored on empty object.
    test({ foo: undefined, hash: 'sha256...' });
    test({ foo: 123, hash: 'sha256...' }, { foo: 123, hash: 'sha256...' });
    test({ foo: undefined });

    // NB: [null] values retained (not the same as [undefined]).
    test({ foo: null }, { foo: null });
    test({ foo: { value: null } }, { foo: { value: null } });
  });
});
