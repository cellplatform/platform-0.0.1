import * as t from '@platform/types';

import { expect } from 'chai';
import { Subject, Observable } from 'rxjs';

import { rx } from '.';
import { time } from '../time';

describe('rx', () => {
  describe('debounceBuffer', () => {
    it('buffers several values', async () => {
      type T = { value: number };
      const source$ = new Subject<T>();
      const buffered$ = rx.debounceBuffer(source$); // NB: default debounce time: 0

      let results: T[][] = [];
      buffered$.subscribe((e) => (results = [...results, e]));

      source$.next({ value: 1 });
      source$.next({ value: 2 });
      source$.next({ value: 3 });
      expect(results.length).to.eql(0);

      await time.wait(0);
      expect(results.length).to.eql(1);
      expect(results[0]).to.eql([{ value: 1 }, { value: 2 }, { value: 3 }]);
    });

    it('buffers into two groups after delay', async () => {
      const source$ = new Subject<number>();
      const buffered$ = rx.debounceBuffer(source$, 10); // NB: default debounce time: 0

      let results: number[][] = [];
      buffered$.subscribe((e) => (results = [...results, e]));

      source$.next(1);
      source$.next(2);
      await time.wait(5); // NB: Still in the first debounce window.
      source$.next(3);

      await time.wait(10);
      source$.next(4);

      await time.wait(10);
      source$.next(5);
      source$.next(6);

      await time.wait(10);
      expect(results.length).to.eql(3);
      expect(results[0]).to.eql([1, 2, 3]);
      expect(results[1]).to.eql([4]);
      expect(results[2]).to.eql([5, 6]);
    });
  });

  describe('event: payload', () => {
    type FooEvent = { type: 'TYPE/foo'; payload: Foo };
    type Foo = { count: number };

    type BarEvent = { type: 'TYPE/bar'; payload: Bar };
    type Bar = { msg: string };

    it('rx.event', () => {
      const source$ = new Subject<FooEvent | BarEvent>();

      const fired: FooEvent[] = [];
      rx.event<FooEvent>(source$, 'TYPE/foo').subscribe((e) => fired.push(e));

      source$.next({ type: 'TYPE/bar', payload: { msg: 'hello' } });
      source$.next({ type: 'TYPE/foo', payload: { count: 123 } });
      source$.next({ type: 'TYPE/bar', payload: { msg: 'hello' } });

      expect(fired.length).to.eql(1);
      expect(fired[0].type).to.eql('TYPE/foo');
      expect(fired[0].payload).to.eql({ count: 123 });
    });

    it('rx.payload', () => {
      const source$ = new Subject<FooEvent | BarEvent>();

      const fired: Foo[] = [];
      rx.payload<FooEvent>(source$, 'TYPE/foo').subscribe((e) => fired.push(e));

      source$.next({ type: 'TYPE/bar', payload: { msg: 'hello' } });
      source$.next({ type: 'TYPE/foo', payload: { count: 123 } });
      source$.next({ type: 'TYPE/bar', payload: { msg: 'hello' } });

      expect(fired.length).to.eql(1);
      expect(fired[0]).to.eql({ count: 123 });
    });
  });

  describe('isEvent', () => {
    const test = (input: any, expected: boolean) => {
      expect(rx.isEvent(input)).to.eql(expected);
    };

    it('is an event', () => {
      test({ type: 'MyEvent', payload: {} }, true);
    });

    it('is not an event', () => {
      test(undefined, false);
      test(null, false);
      test(1, false);
      test(true, false);
      test('two', false);
      test({}, false);
      test({ type: 123, payload: {} }, false);
      test({ type: 'FOO' }, false);
      test({ type: 'FOO', payload: 123 }, false);
    });

    it('is an event of given type', () => {
      const test = (input: any, type: any, expected: boolean) => {
        expect(rx.isEvent(input, type)).to.eql(expected);
      };

      test(undefined, 'foo', false);
      test(null, 'foo', false);
      test(123, 'foo', false);
      test({}, 'foo', false);
      test({ type: 'foo', payload: {} }, 'bar', false);

      test({ type: 'foo', payload: {} }, 'foo', true);
      test({ type: 'foo/bar', payload: {} }, { startsWith: 'foo/bar' }, true);
      test({ type: 'foo/bar', payload: {} }, { startsWith: 'foo/' }, true);
      test({ type: 'foo/bar', payload: {} }, { startsWith: 'foo' }, true);

      test({ type: 'foo', payload: {} }, '  foo  ', false);
      test({ type: 'foo', payload: {} }, 123, false);
      test({ type: 'foo', payload: {} }, null, false);
      test({ type: 'foo', payload: {} }, {}, false);
      test({ type: 'foo/bar', payload: {} }, { startsWith: undefined }, false);
      test({ type: 'foo/bar', payload: {} }, { startsWith: null }, false);
    });
  });

  describe('bus', () => {
    type MyEvent = IFooEvent | IBarEvent;
    type IFooEvent = { type: 'Event/foo'; payload: { count?: number } };
    type IBarEvent = { type: 'Event/bar'; payload: { count?: number } };

    it('create: new observable (no param, no type)', () => {
      const bus = rx.bus();

      const fired: t.Event[] = [];
      bus.$.subscribe((e) => fired.push(e));

      bus.fire({ type: 'ANY', payload: {} });

      expect(fired.length).to.eql(1);
      expect(fired[0].type).to.eql('ANY');
    });

    it('create: use given subject', () => {
      const source$ = new Subject<any>(); // NB: Does not care the typing of the input observable (flexible).
      const bus = rx.bus<MyEvent>(source$);

      const fired: MyEvent[] = [];
      bus.$.subscribe((e) => fired.push(e));

      source$.next({ type: 'ANY', payload: {} });

      bus.fire({ type: 'Event/foo', payload: {} });

      expect(fired.length).to.eql(2);
      expect(fired[0].type).to.eql('ANY');
      expect(fired[1].type).to.eql('Event/foo');
    });

    it('create: use given bus', () => {
      const bus1 = rx.bus();
      const bus2 = rx.bus(bus1);
      expect(bus2).to.equal(bus1);
    });

    it('filters out non-standard [event] objects from the stream', () => {
      const source$ = new Subject<any>();
      const bus = rx.bus<MyEvent>(source$);

      const fired: MyEvent[] = [];
      bus.$.subscribe((e) => fired.push(e));

      // NB: All data-types that do not conform to the shape of a [Event].
      source$.next(undefined);
      source$.next(null);
      source$.next(1);
      source$.next(true);
      source$.next('two');
      source$.next({});
      source$.next({ type: 123, payload: {} });
      source$.next({ type: 'FOO' });
      source$.next({ type: 'FOO', payload: 123 });

      expect(fired.length).to.eql(0);
    });
  });

  describe('isBus', () => {
    it('is bus', () => {
      const test = (input: any) => {
        expect(rx.isBus(input)).to.eql(true);
      };
      test({ $: new Observable(), fire: () => null });
      test(rx.bus());
    });

    it('is not a bus', () => {
      const test = (input: any) => {
        expect(rx.isBus(input)).to.eql(false);
      };
      test(undefined);
      test(null);
      test(123);
      test({});
      test([123, {}]);
      test({ event$: new Observable() });
      test({ $: new Observable() });
      test({ fire: () => null });
    });
  });

  describe('busAsType', () => {
    type MyEvent = IFooEvent | IBarEvent;
    type IFooEvent = { type: 'Event/foo'; payload: { count?: number } };
    type IBarEvent = { type: 'Event/bar'; payload: { count?: number } };

    it('changes event type', () => {
      const bus1 = rx.bus();

      const fired: t.Event[] = [];
      bus1.$.subscribe((e) => fired.push(e));

      const bus2 = rx.busAsType<MyEvent>(bus1);
      bus2.fire({ type: 'Event/bar', payload: {} });

      expect(fired.length).to.eql(1);
      expect(fired[0].type).to.eql('Event/bar');
    });
  });

  describe('disposable', () => {
    it('method: dispose', () => {
      const { dispose$, dispose } = rx.disposable();

      let count = 0;
      dispose$.subscribe(() => count++);

      dispose();
      dispose();
      dispose();

      expect(count).to.eql(1); // NB: Multiple calls only fire the observable event once.
    });

    it('until$', () => {
      const until$ = new Subject<number>();
      const { dispose$ } = rx.disposable(until$);

      let count = 0;
      dispose$.subscribe(() => count++);

      expect(count).to.eql(0);

      until$.next(123);
      until$.next(456);
      expect(count).to.eql(1);
    });
  });

  describe('asPromise', () => {
    type E = { type: 'foo'; payload: { count: number } };

    describe('first', () => {
      it('resolves first response', async () => {
        const $ = new Subject<E>();
        const promise = rx.asPromise.first<E>(rx.payload<E>($, 'foo'));

        $.next({ type: 'foo', payload: { count: 1 } });
        $.next({ type: 'foo', payload: { count: 2 } });
        $.next({ type: 'foo', payload: { count: 3 } });

        const res = await promise;
        expect(res.payload).to.eql({ count: 1 });
        expect(res.error).to.eql(undefined);
      });

      it('error: completed observable', async () => {
        const $ = new Subject<E>();
        $.complete();

        const res = await rx.asPromise.first<E>(rx.payload<E>($, 'foo'));

        expect(res.payload).to.eql(undefined);
        expect(res.error?.code).to.eql('completed');
        expect(res.error?.message).to.include('The given observable has already "completed"');
      });

      it('error: timeout', async () => {
        const $ = new Subject<E>();
        const res = await rx.asPromise.first<E>(rx.payload<E>($, 'foo'), { timeout: 10 });
        expect(res.payload).to.eql(undefined);
        expect(res.error?.code).to.eql('timeout');
        expect(res.error?.message).to.include('Timed out after 10 msecs');
      });

      it('error: timeout ("op")', async () => {
        const op = 'foobar';
        const $ = new Subject<E>();
        const res = await rx.asPromise.first<E>(rx.payload<E>($, 'foo'), { op, timeout: 10 });
        expect(res.payload).to.eql(undefined);
        expect(res.error?.code).to.eql('timeout');
        expect(res.error?.message).to.include('Timed out after 10 msecs');
        expect(res.error?.message).to.include(`[${op}]`);
      });
    });
  });
});
