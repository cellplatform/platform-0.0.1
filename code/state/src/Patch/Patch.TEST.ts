import { Patch } from '.';
import { expect, t, time } from '../test';

describe('Patch', () => {
  describe('toPatchSet', () => {
    it('empty', () => {
      const test = (forward?: any, backward?: any) => {
        const res = Patch.toPatchSet(forward, backward);
        expect(res.prev).to.eql([]);
        expect(res.next).to.eql([]);
      };

      test();
      test([], []);
      test(undefined, []);
      test(undefined, []);
      test(undefined, [undefined]);
    });

    it('converts paths to strings', () => {
      const p1: t.ArrayPatch = { op: 'add', path: ['foo', 'bar'], value: 123 };
      const p2: t.ArrayPatch = { op: 'remove', path: ['foo', 'bar'], value: 123 };

      const test = (res: t.PatchSet) => {
        expect(res.next[0].op).to.eql('add');
        expect(res.prev[0].op).to.eql('remove');

        expect(res.next[0].path).to.eql('foo/bar');
        expect(res.prev[0].path).to.eql('foo/bar');
      };

      test(Patch.toPatchSet([p1], [p2]));
      test(Patch.toPatchSet(p1, p2));
    });

    it('throw: when property name contains "/"', () => {
      // NB: "/" characters in property names confuse the [patch] path values.
      //     Just don't do it!
      const patch: t.ArrayPatch = { op: 'add', path: ['foo', 'bar/baz'], value: 123 };
      const err = /Property names cannot contain the "\/" character/;

      expect(() => Patch.toPatchSet(patch)).to.throw(err);
      expect(() => Patch.toPatchSet([], patch)).to.throw(err);
    });
  });

  describe('isEmpty', () => {
    const test = (input: any, expected: boolean) => {
      const res = Patch.isEmpty(input);
      expect(res).to.eql(expected);
    };

    it('is empty', () => {
      test(undefined, true);
      test(null, true);
      test({}, true);
      test(' ', true);
      test({ next: [], prev: [] }, true);
    });

    it('is not empty', () => {
      const p1: t.ArrayPatch = { op: 'add', path: ['foo', 'bar'], value: 123 };
      const p2: t.ArrayPatch = { op: 'remove', path: ['foo', 'bar'], value: 123 };
      const patches = Patch.toPatchSet([p1, p2], [p2, p1]);
      test(patches, false);
    });
  });

  describe('produce (aka change)', () => {
    it('produce (op: "update" change)', () => {
      const obj = { msg: 'hello', child: { foo: [123] } };

      const res = Patch.produce(obj, (draft) => {
        draft.msg = 'foobar';
        draft.child.foo.push(456);
      });

      expect(res.to.msg).to.eql('foobar');
      expect(res.to.child.foo).to.eql([123, 456]);

      expect(res.op).to.eql('update');
      expect(res.patches.prev.map((c) => c.path)).to.eql(['child/foo/length', 'msg']);
      expect(res.patches.next.map((c) => c.path)).to.eql(['child/foo/1', 'msg']);
    });

    it('produce (op: "replace" change)', () => {
      const obj1 = { child: { msg: 'one' } };
      const obj2 = { child: { msg: 'two' } };

      const res = Patch.produce(obj1, obj2);

      expect(res.op).to.eql('replace');
      expect(res.to).to.eql(obj2);

      expect(res.patches.prev).to.eql([{ op: 'replace', path: '', value: obj1 }]);
      expect(res.patches.next).to.eql([{ op: 'replace', path: '', value: obj2 }]);
    });

    it('produceAsync', async () => {
      const obj = { msg: 'hello', child: { foo: [123] } };

      const res = await Patch.produceAsync(obj, async (draft) => {
        await time.wait(10);
        draft.msg = 'foobar';
        draft.child.foo.push(456);
      });

      expect(res.to.msg).to.eql('foobar');
      expect(res.to.child.foo).to.eql([123, 456]);

      expect(res.op).to.eql('update');
      expect(res.patches.prev.map((c) => c.path)).to.eql(['child/foo/length', 'msg']);
      expect(res.patches.next.map((c) => c.path)).to.eql(['child/foo/1', 'msg']);
    });
  });

  describe('apply', () => {
    it('applies patches forward (next)', () => {
      const obj = { child: { foo: [123] } };
      const res = Patch.produce(obj, (draft) => draft.child.foo.push(456));

      expect(obj.child.foo).to.eql([123]); // NB: No change.
      expect(res.op).to.eql('update');
      expect(res.to.child.foo).to.eql([123, 456]);

      // NB: PatchSet passed, [next] set of patches assumed.
      expect(Patch.apply(obj, res.patches).child.foo).to.eql([123, 456]);
    });

    it('applies patches backward (prev)', () => {
      const obj = { child: { foo: [123] } };
      const res = Patch.produce(obj, (draft) => draft.child.foo.push(456));

      const next = Patch.apply(obj, res.patches.next);
      const prev = Patch.apply(next, res.patches.prev);

      expect(next.child.foo).to.eql([123, 456]);
      expect(prev.child.foo).to.eql([123]);
    });
  });
});
