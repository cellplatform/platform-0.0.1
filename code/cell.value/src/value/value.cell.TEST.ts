import { expect } from 'chai';
import { t } from '../common';
import { value } from '.';

describe('cell', () => {
  it('isEmptyCell', () => {
    const hash = '346854e8420ee165a8146d0c385eb148f172c7cabb3a3b76d542252890cd0cf9';
    const test = (input: t.ICellData<any> | undefined, expected: boolean) => {
      expect(value.isEmptyCell(input)).to.eql(expected);
    };
    test(undefined, true);
    test({ value: '' }, true);
    test({ value: undefined }, true);
    test({ value: '', hash }, true);
    test({ value: undefined, hash: 'abc123z' }, true);
    test({ value: undefined, props: {} }, true); // NB: props object is empty.
    test({ value: '', props: {} }, true);
    test({ value: '', props: { status: {} } }, true);
    test({ value: '', props: { status: {}, style: {}, view: {}, merge: {} } }, true);
    test({ value: undefined, props: { status: {}, style: {}, view: {}, merge: {} } }, true);
    test({ props: { status: {}, style: {}, view: {}, merge: {} } }, true);
    test({ value: undefined, props: { value: undefined } }, true);

    test({ value: ' ' }, false);
    test({ value: ' ', hash }, false);
    test({ value: 0 }, false);
    test({ value: null }, false);
    test({ value: {} }, false);
    test({ value: { foo: 123 } }, false);
    test({ value: true }, false);
    test({ value: false }, false);
    test({ value: undefined, props: { value: 456 } }, false); // NB: has props, therefore not empty.
  });

  it('isEmptyCellValue', () => {
    const test = (input: t.CellValue | undefined, expected: boolean) => {
      expect(value.isEmptyCellValue(input)).to.eql(expected);
    };
    test(undefined, true);
    test('', true);

    test(' ', false);
    test(null, false);
    test(0, false);
    test(123, false);
    test({}, false);
    test([], false);
    test(true, false);
    test(false, false);
  });

  it('isEmptyCellProps', () => {
    const test = (input: {} | undefined, expected: boolean) => {
      expect(value.isEmptyCellProps(input)).to.eql(expected);
    };
    test(undefined, true);
    test({}, true);
    test({ style: {} }, true);
    test({ style: {}, merge: {} }, true);
    test({ style: {}, merge: {}, view: {} }, true);
    test({ status: {} }, true);
    test({ value: undefined }, true);

    test({ style: { bold: true } }, false);
    test({ style: { bold: true }, merge: {} }, false);
    test({ view: { type: 'DEFAULT' } }, false);
    test({ status: { error: { message: 'Fail', type: 'UNKNOWN' } } }, false);
  });

  it('squashProps', () => {
    const test = (props?: {}, expected?: any) => {
      const res = value.squashProps(props);
      expect(res).to.eql(expected);
    };
    test();
    test({});
    test({ style: {} });
    test({ merge: {} });
    test({ style: {}, merge: {} });
    test({ style: { bold: true }, merge: {} }, { style: { bold: true } });
  });

  describe('cellHash', () => {
    it('hashes a cell', () => {
      const test = (input: {} | undefined, expected: string) => {
        const hash = value.cellHash('A1', input);
        expect(hash.endsWith(expected)).to.eql(true);
      };

      test(undefined, 'd304e202ed0c5ae3ad99ab80c5c112');
      test({ value: undefined }, 'd304e202ed0c5ae3ad99ab80c5c112');
      test({ value: null }, 'ab3b5367a7f46f42555c20b29d5a2a');
      test({ value: 123 }, 'fa9a31fe9a69d97a2fff6750f400a9');
      test({ value: 'hello' }, 'fd41a0fb0320500ab7db00b12c43a8');
      test({ value: 'hello', props: {} }, 'fd41a0fb0320500ab7db00b12c43a8');
      test({ value: 'hello', props: { style: { bold: true } } }, '595d0855352286bccc32f701a2b823');
    });

    it('same hash for no param AND no cell-value', () => {
      const HASH = 'sha256/2d7331843f6bcc32bf4c166f4afaeae595d304e202ed0c5ae3ad99ab80c5c112';
      const test = (input?: t.ICellData) => {
        const hash = value.cellHash('A1', input);
        expect(hash).to.eql(HASH);
      };
      test();
      test(undefined);
      test({ value: undefined });
    });

    it('returns same hash for equivalent props variants', () => {
      const HASH = 'sha256/08be796d228342a967d0c5117165e9027ffa9a31fe9a69d97a2fff6750f400a9';
      const test = (props?: {}) => {
        const hash = value.cellHash('A1', { value: 123, props });
        expect(hash).to.eql(HASH);
      };
      test();
      test({});
      test({ style: {} });
      test({ merge: {} });
      test({ style: {}, merge: {} });
    });
  });

  describe('cellDiff', () => {
    it('no difference', () => {
      const cell: t.ICellData<{}> = { value: 1, props: { style: { bold: true } } };
      const res = value.cellDiff(cell, cell);
      expect(res.left).to.eql(cell);
      expect(res.right).to.eql(cell);
      expect(res.isDifferent).to.eql(false);
      expect(res.list.length).to.eql(0);
    });

    it('is different', () => {
      const left: t.ICellData<{}> = { value: 1, props: { style: { bold: true } } };
      const right: t.ICellData<{}> = { value: 2, props: { style: { bold: false } } };
      const res = value.cellDiff(left, right);

      expect(res.isDifferent).to.eql(true);
      expect(res.list.length).to.eql(2);

      expect((res.list[0].path || []).join('.')).to.eql('value');
      expect((res.list[1].path || []).join('.')).to.eql('props.style.bold');
    });
  });
});
