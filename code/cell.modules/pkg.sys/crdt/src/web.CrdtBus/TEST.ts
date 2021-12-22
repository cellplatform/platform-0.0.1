import { t, expect, pkg, rx, Test, cuid, Is, Automerge } from '../web.test';
import { CrdtBus } from '.';

type Doc = { count: number; name?: string };

export default Test.describe('CrdtBus', (e) => {
  const bus = rx.bus();

  e.describe('is', (e) => {
    const is = CrdtBus.Events.is;

    e.it('is (static/instance)', () => {
      const events = CrdtBus.Events({ bus });
      expect(events.is).to.equal(is);
    });

    e.it('is.base', () => {
      const test = (type: string, expected: boolean) => {
        expect(is.base({ type, payload: {} })).to.eql(expected);
      };
      test('foo', false);
      test('sys.crdt/', true);
    });

    e.it('is.instance', () => {
      const type = 'sys.crdt/';
      expect(is.instance({ type, payload: { id: 'abc' } }, 'abc')).to.eql(true);
      expect(is.instance({ type, payload: { id: 'abc' } }, '123')).to.eql(false);
      expect(is.instance({ type: 'foo', payload: { id: 'abc' } }, 'abc')).to.eql(false);
    });
  });

  e.describe('controller', (e) => {
    e.it('id', async (e) => {
      const id = 'foo';
      const c1 = CrdtBus.Controller({ bus });
      const c2 = CrdtBus.Controller({ bus, id });
      expect(c1.id).to.eql('default-instance');
      expect(c2.id).to.eql(id);

      const fired = { e1: 0, e2: 0 };
      c1.events.$.subscribe((e) => fired.e1++);
      c2.events.$.subscribe((e) => fired.e2++);

      const info1 = await c1.events.info.get();
      expect(fired).to.eql({ e1: 2, e2: 0 }); // NB: 2 == req/res

      const info2 = await c2.events.info.get();
      expect(fired).to.eql({ e1: 2, e2: 2 }); // NB: 2 == req/res

      expect(info1.id).to.eql('default-instance');
      expect(info2.id).to.eql(id);

      c1.dispose();
      c2.dispose();
    });

    e.it('filter', async (e) => {
      let blockId = '';
      const c = CrdtBus.Controller({
        bus,
        id: 'foo',
        filter: (e) => (!blockId ? true : e.payload.id !== blockId),
      });

      const info1 = await c.events.info.get({ timeout: 5 });
      blockId = 'foo'; // NB: adjust dummy filter.
      const info2 = await c.events.info.get({ timeout: 5 });

      expect(info1.id).to.eql('foo');
      expect(info2.error).to.include('Timed out');

      c.dispose();
    });
  });

  e.describe('events (API)', (e) => {
    e.describe('info', (e) => {
      e.it('exists', async () => {
        const { dispose, events } = CrdtBus.Controller({ bus });
        const res = await events.info.get();
        dispose();

        expect(res.id).to.eql('default-instance');

        expect(res.info?.module.name).to.eql(pkg.name);
        expect(res.info?.module.version).to.eql(pkg.version);

        expect(res.info?.dataformat.name).to.eql('automerge');
        expect(res.info?.dataformat.version).to.eql(pkg.dependencies?.automerge);
      });

      e.it('does not exist', async () => {
        const events = CrdtBus.Events({ bus });
        const res = await events.info.get({ timeout: 10 });
        expect(res.error).to.include('[info] Timed out');
      });
    });

    e.describe('state (ref)', (e) => {
      e.it('initial via plain { object }', async () => {
        const { dispose, events } = CrdtBus.Controller({ bus });
        const doc = cuid();
        const initial: Doc = { count: 0 };

        const res1 = await events.state.fire<Doc>({ doc, initial });
        const res2 = await events.state.fire<Doc>({ doc, initial });
        dispose();

        expect(res1.doc.id).to.eql(doc);
        expect(res1.doc.data).to.eql(initial);
        expect(Is.automergeObject(res1.doc.data)).to.eql(true);
        expect(res1.changed).to.eql(false);
        expect(res1.error).to.eql(undefined);

        expect(res1.created).to.eql(true);
        expect(res2.created).to.eql(false); // NB: second call retrieves existing state.
      });

      e.it('initial via { Automerge } object', async () => {
        const { dispose, events } = CrdtBus.Controller({ bus });
        const doc = cuid();
        const initial = Automerge.from<Doc>({ count: 0 });

        const res = await events.state.fire<Doc>({ doc, initial });
        dispose();

        expect(res.doc.id).to.eql(doc);
        expect(res.doc.data).to.eql(initial);
        expect(Is.automergeObject(res.doc.data)).to.eql(true);
      });

      e.it('initial via function', async () => {
        const { dispose, events } = CrdtBus.Controller({ bus });
        const doc = cuid();
        const initial: Doc = { count: 0 };

        const res = await events.state.fire<Doc>({ doc, initial: () => initial });
        dispose();

        expect(res.doc.id).to.eql(doc);
        expect(res.doc.data).to.eql(initial);
        expect(Is.automergeObject(res.doc.data)).to.eql(true);
      });

      e.it('exists', async () => {
        const { dispose, events } = CrdtBus.Controller({ bus });
        const doc = cuid();
        const initial: Doc = { count: 0 };

        const test = async (exists: boolean) => {
          const res = await events.state.exists.fire(doc);
          expect(res.exists).to.eql(exists);
          expect(res.error).to.eql(undefined);
          expect(res.doc).to.eql(doc);
        };

        await test(false);

        await events.state.fire<Doc>({ doc, initial });
        await test(true);

        await events.state.remove.fire(doc);
        await test(false);

        dispose();
      });

      e.it('remove (memory ref)', async () => {
        const { dispose, events } = CrdtBus.Controller({ bus });
        const doc = cuid();
        const initial: Doc = { count: 0 };

        const res1 = await events.state.fire<Doc>({ doc, initial });
        const res2 = await events.state.fire<Doc>({ doc, initial });

        expect(res1.created).to.eql(true);
        expect(res2.created).to.eql(false);

        events.state.remove.fire(doc);
        const res3 = await events.state.fire<Doc>({ doc, initial });
        expect(res3.created).to.eql(true); // NB: Initialized again as the reference was removed from memory.

        dispose();
      });

      e.it('change', async () => {
        const { dispose, events } = CrdtBus.Controller({ bus });
        const doc = cuid();
        const initial: Doc = { count: 0 };

        const change = (doc: Doc) => {
          doc.count = 123;
          doc.name = 'hello';
        };

        const res = await events.state.fire<Doc>({ doc, initial, change });
        expect(res.changed).to.eql(true);
        expect(res.doc.data.count).to.eql(123);
        expect(res.doc.data.name).to.eql('hello');

        dispose();
      });

      e.it('changed (events)', async () => {
        const { dispose, events } = CrdtBus.Controller({ bus });
        const doc = cuid();
        const initial: Doc = { count: 0 };

        const changed: t.CrdtRefChanged[] = [];
        events.state.changed$.subscribe((e) => changed.push(e));

        await events.state.fire<Doc>({ doc, initial, change: (doc) => (doc.name = 'foobar') });
        await events.state.fire<Doc>({ doc, initial, change: (doc) => doc.count++ });

        expect(changed.length).to.eql(2);

        expect(changed[0].doc.prev).to.eql(initial);
        expect(changed[0].doc.next).to.eql({ name: 'foobar', count: 0 });

        expect(changed[1].doc.prev).to.eql(changed[0].doc.next);
        expect(changed[1].doc.next).to.eql({ name: 'foobar', count: 1 });

        dispose();
      });
    });

    e.describe('doc', (e) => {
      const TestSetup = {
        async base() {
          const controller = CrdtBus.Controller({ bus });
          const { dispose, events } = controller;
          return { controller, dispose, events };
        },
        async doc(options: { id?: string; initial?: Doc } = {}) {
          const base = await TestSetup.base();
          const initial: Doc = options.initial ?? { count: 0 };
          const { controller, dispose, events } = base;
          const id = options.id ?? cuid();
          const doc = await events.doc<Doc>({ id, initial });
          return { controller, dispose, events, id, initial, doc };
        },
      };

      e.it('from initial { object } and function', async () => {
        const { dispose, events } = await TestSetup.base();
        const initial: Doc = { count: 123 };
        const res1 = await events.doc<Doc>({ id: '1', initial });
        const res2 = await events.doc<Doc>({ id: '2', initial: () => initial });
        dispose();

        expect(res1.id).to.eql('1');
        expect(res1.current).to.eql(initial);

        expect(res2.id).to.eql('2');
        expect(res2.current).to.eql(initial);

        expect(res1.current).to.not.equal(res2.current); // NB: Not the same document instance.
      });

      e.it('same document instance', async () => {
        const { dispose, events } = await TestSetup.base();
        const initial: Doc = { count: 123 };
        const res1 = await events.doc<Doc>({ id: '1', initial });
        const res2 = await events.doc<Doc>({ id: '1', initial });
        const res3 = await events.doc<Doc>({ id: '2', initial });
        dispose();

        expect(res1.current).to.equal(res2.current);
        expect(res1.current).to.not.equal(res3.current); // NB: Not the same document instance.
      });

      e.it('from initial [Automerge] object', async () => {
        const { dispose, events } = await TestSetup.base();
        const res1 = await events.doc<Doc>({ id: '1', initial: { count: 0 } });
        const res2 = await events.doc<Doc>({ id: '2', initial: res1.current });
        dispose();

        expect(res1.current).to.eql(res2.current);
        expect(res1.current).to.not.equal(res2.current);
      });

      e.it('change', async () => {
        const { dispose, doc } = await TestSetup.doc();
        expect(doc.current.count).to.eql(0);

        const fired: t.CrdtRefChanged[] = [];
        doc.changed$.subscribe((e) => fired.push(e));
        const res = await doc.change((draft) => draft.count++);
        dispose();

        expect(res).to.eql({ count: 1 });

        expect(fired.length).to.eql(1);
        expect(fired[0].doc.id).to.eql(doc.id);
        expect(fired[0].doc.prev).to.eql({ count: 0 });
        expect(fired[0].doc.next).to.eql({ count: 1 });
      });

      e.it('change registered between different instances', async () => {
        const test1 = await TestSetup.doc();
        const test2 = await TestSetup.doc();

        const doc1 = test1.doc;
        const doc2 = test1.doc;

        expect(doc1.current).to.eql({ count: 0 });
        expect(doc2.current).to.eql({ count: 0 });

        await doc1.change((doc) => (doc.count = 123));

        expect(doc1.current).to.eql({ count: 123 });
        expect(doc2.current).to.eql({ count: 123 });

        test1.dispose();
        test2.dispose();
      });
    });
  });

  e.describe.skip('sync__OLD', (e) => {
    e.it.skip('tmp', async () => {
      const ctrl1 = CrdtBus.Controller({ bus, id: '1' });
      const ctrl2 = CrdtBus.Controller({ bus, id: '2' });

      // const { dispose, events } = CrdtBus.Controller({ bus });
      // const res = await events.info.get();

      const id = cuid();
      const initial: Doc = { count: 0 };

      const init1 = Automerge.initSyncState();
      const init2 = Automerge.initSyncState();

      const doc1 = await ctrl1.events.doc<Doc>({ id, initial });
      const doc2 = await ctrl2.events.doc<Doc>({ id, initial: doc1.current });
      // const doc2 = await ctrl2.events.doc<Doc>({ id, initial });

      // const res = await events.state.fire<Doc>({ doc: docId, initial });

      doc1.change((draft) => (draft.count = 123));

      // doc.current
      console.log('doc1.current', doc1.current);
      console.log('doc2.current', doc2.current);
      console.log('-------------------------------------------');

      console.log('init1', init1);

      const [next, syncMessage] = Automerge.generateSyncMessage(doc1.current, init1);

      console.log('next', next);
      console.log('syncMessage', syncMessage);

      // return;
      // console.log('res', res);

      if (syncMessage) {
        console.log('-------------------------------------------');
        // doc2.change((draft) => (draft.count = 1));
        // doc2.change((draft) => (draft.count = 2));

        const r = Automerge.receiveSyncMessage<Doc>(
          doc2.current, // TEMP 🐷
          init2,
          syncMessage,
        );
        console.log('r', r);
      }

      ctrl1.dispose();
      ctrl2.dispose();
    });

    e.it.skip('sync', async () => {
      let doc1 = Automerge.from<Doc>({ count: 0 });
      const doc2 = Automerge.from<Doc>(doc1);

      const init1 = Automerge.initSyncState();
      const init2 = Automerge.initSyncState();

      expect(doc1).to.eql(doc2);
      expect(doc1).to.not.equal(doc2);

      doc1 = Automerge.change(doc1, (d) => (d.count = 123));

      expect(doc1).to.not.eql(doc2);

      const [next, syncMessage] = Automerge.Backend.generateSyncMessage(doc1, init1);

      // Automerge.Frontend.

      if (syncMessage) {
        const r = Automerge.receiveSyncMessage<Doc>(
          doc2, // TEMP 🐷
          init2,
          syncMessage,
        );

        console.log('r', r);
      }
    });
  });
});
