import { fs, createMock, expect, http, t, TypeSystem, Client, ERROR } from '../../test';
import * as g from '../.d.ts/MyRow';

/**
 * NOTE:
 *    For a more comprehensive set of type decalration
 *    examples see module:
 *
 *          @platform/cell.typesystem
 *
 */
type SampleTypeDefs = { 'ns:foo': t.ITypeDefPayload; 'ns:foo.color': t.ITypeDefPayload };
const TYPE_DEFS: SampleTypeDefs = {
  'ns:foo': {
    columns: {
      A: { props: { def: { prop: 'MyRow.title', type: 'string', default: 'Untitled' } } },
      B: {
        props: {
          def: [
            { prop: 'MyRow.isEnabled', type: 'boolean', target: 'inline:isEnabled', default: true },
            { prop: 'MyOther.label', type: 'string', target: 'inline:other', default: 'Untitled' },
          ],
        },
      },
      C: {
        props: {
          def: { prop: 'MyRow.color', type: 'ns:foo.color/MyColor', target: 'inline:color' },
        },
      },
    },
  },

  'ns:foo.color': {
    columns: {
      A: { props: { def: { prop: 'MyColor.label', type: 'string' } } },
      B: { props: { def: { prop: 'MyColor.color', type: '"red" | "green" | "blue"' } } },
    },
  },
};

const writeTypes = async (client: t.IHttpClient) => {
  const write = async (ns: keyof SampleTypeDefs) => client.ns(ns).write(TYPE_DEFS[ns]);
  await write('ns:foo');
  await write('ns:foo.color');
  return { client };
};

describe('TypeSystem ➔ HTTP', () => {
  describe('generate [.d.ts] file', () => {
    it('MyRow', async () => {
      const mock = await createMock();
      await writeTypes(mock.client);

      const client = Client.typesystem({ http: mock.client });
      const ts = await client.typescript('ns:foo');
      await mock.dispose();

      const dir = fs.resolve('src/tests/.d.ts');
      const path = fs.join(dir, 'MyRow.ts');
      await ts.save(fs, path);

      const file = (await fs.readFile(path)).toString();

      expect(file).to.include(`|➔  ns:foo`);
      expect(file).to.include(`export declare type MyRow = {`);
      expect(file).to.include(`export declare type MyOther = {`);
    });
  });

  describe('TypeClient', () => {
    describe('url: /ns:foo/types', () => {
      it('404 not found', async () => {
        const mock = await createMock();
        // NB: No type data is written (allowing a 404 to be achieved).

        const res = await http.get(mock.url('ns:foo/types'));
        await mock.dispose();

        expect(res.ok).to.eql(false);
        expect(res.status).to.eql(404);

        const json = res.json as t.IHttpError;
        expect(json.status).to.eql(404);
        expect(json.type).to.eql(ERROR.HTTP.NOT_FOUND);
        expect(json.message).to.include(`Failed to retrieve type definitions for (ns:foo)`);
      });

      it('types object (ast)', async () => {
        const mock = await createMock();
        await writeTypes(mock.client);

        const res = await http.get(mock.url('ns:foo/types'));
        await mock.dispose();

        expect(res.ok).to.eql(true);
        expect(res.status).to.eql(200);

        const json = res.json as t.IResGetNsTypes;
        const types = json.types;

        expect(json.uri).to.eql('ns:foo');
        expect(types.length).to.eql(2);

        expect(types[0].typename).to.eql('MyRow');
        expect(types[0].columns.map((def) => def.prop)).to.eql(['title', 'isEnabled', 'color']);

        expect(types[1].typename).to.eql('MyOther');
        expect(types[1].columns.map((def) => def.prop)).to.eql(['label']);

        // Default all typescript declarations.
        expect(json.typescript).to.include(`export declare type MyRow`);
        expect(json.typescript).to.include(`export declare type MyOther`);
        expect(json.typescript).to.include(`export declare type MyColor`);
      });
    });

    describe('url: /ns:foo/types?typename (querystring)', () => {
      const getResponse = async (url: string) => {
        const mock = await createMock();
        await writeTypes(mock.client);

        const res = await http.get(mock.url(url));
        await mock.dispose();

        const json = res.json as t.IResGetNsTypes;
        const types = json.types;
        return { res, json, types };
      };

      it('?typename=<undefined> (default true)', async () => {
        const test = async (url: string) => {
          const { json } = await getResponse(url);
          expect(json.types.map((def) => def.typename)).to.eql(['MyRow', 'MyOther']);
          expect(json.typescript).to.include(`export declare type MyRow`);
          expect(json.typescript).to.include(`export declare type MyOther`);
          expect(json.typescript).to.include(`export declare type MyColor`);
        };

        await test('ns:foo/types');
        await test('ns:foo/types?');
        await test('ns:foo/types?typename=');
        await test('ns:foo/types?typename');
        await test('ns:foo/types?typename=true');
      });

      it('?typename=false', async () => {
        const { json } = await getResponse('ns:foo/types?typename=false');
        expect(json.types).to.eql([]);
        expect(json.typescript).to.eql('');
      });

      it('?typename=<name>', async () => {
        const test = async (url: string, typenames: string[]) => {
          const { json } = await getResponse(url);
          expect(json.types.map((def) => def.typename)).to.eql(typenames);
          typenames.forEach((typename) => {
            expect(json.typescript).to.include(`export declare type ${typename}`);
          });
          if (typenames.length === 0) {
            expect(json.typescript).to.eql('');
          }
        };

        // Direct match
        await test('ns:foo/types?typename=MyRow', ['MyRow']);
        await test('ns:foo/types?typename=MyRow&typename=MyOther', ['MyRow', 'MyOther']);

        // Wildcard.
        await test('ns:foo/types?typename=My*', ['MyRow', 'MyOther']);
        await test('ns:foo/types?typename=*y*', ['MyRow', 'MyOther']);
        await test('ns:foo/types?typename=*yR*', ['MyRow']);
        await test('ns:foo/types?typename=*er', ['MyOther']);

        // Not found.
        await test('ns:foo/types?typename=MyColor', []); // NB: Not a root type.
        await test('ns:foo/types?typename=FooBar', []);
        await test('ns:foo/types?typename=myRow', []);
      });
    });
  });

  describe('TypedSheet', () => {
    const writeMySheetRows = async <T>(client: t.IHttpClient, rows?: T[]) => {
      const fetch = TypeSystem.fetcher.fromClient(client);
      const defs = (await TypeSystem.client(fetch).load('ns:foo')).defs;

      const items: any[] = rows || [
        { title: 'One', isEnabled: true, color: { label: 'background', color: 'red' } },
        { title: 'Two', isEnabled: false, color: { label: 'foreground', color: 'blue' } },
      ];

      const cells = TypeSystem.objectToCells<T>(defs[0]).rows(0, items);

      const ns = 'ns:foo.mySheet';
      await client.ns('foo.mySheet').write({
        ns: { type: { implements: 'ns:foo' } },
        cells,
      });

      return { ns, cells };
    };

    it('fetch from [http] server', async () => {
      const mock = await createMock();
      await writeTypes(mock.client);
      await writeMySheetRows(mock.client);

      const requests: string[] = [];
      mock.service.request$.subscribe((e) => requests.push(e.url));

      const ns = 'ns:foo.mySheet';
      const sheet = await TypeSystem.Sheet.client(mock.client).load<g.TypeIndex>(ns);

      const cursor = await sheet.data('MyRow').load();
      await mock.dispose();

      expect(requests.some((url) => url === '/ns:foo')).to.eql(true);
      expect(requests.some((url) => url === '/ns:foo.color')).to.eql(true);
      expect(requests.some((url) => url === '/ns:foo.mySheet')).to.eql(true);

      expect(cursor.uri.toString()).to.eql(ns);
      const row1 = cursor.row(0);
      const row2 = cursor.row(1);

      expect(row1).to.not.eql(undefined);
      expect(row2).to.not.eql(undefined);

      if (row1) {
        expect(row1.props.title).to.eql('One');
        expect(row1.props.isEnabled).to.eql(true);
        expect(row1.props.color).to.eql({ label: 'background', color: 'red' });
      }

      if (row2) {
        expect(row2.props.title).to.eql('Two');
        expect(row2.props.isEnabled).to.eql(false);
        expect(row2.props.color).to.eql({ label: 'foreground', color: 'blue' });
      }
    });

    it('from [Client]', async () => {
      const mock = await createMock();
      await writeTypes(mock.client);
      await writeMySheetRows(mock.client);

      const requests: string[] = [];
      mock.service.request$.subscribe((e) => requests.push(e.url));

      const ns = 'ns:foo.mySheet';
      const client = Client.typesystem({ http: mock.client });
      expect(client.http).to.eql(mock.client);

      const sheet = await client.sheet<g.TypeIndex>(ns);
      const cursor = await sheet.data('MyRow').load();
      const row = cursor.row(0).props;

      await mock.dispose();

      expect(sheet.types.map((def) => def.typename)).to.eql(['MyRow', 'MyOther']);
      expect(row.title).to.eql('One');
    });

    it.skip('sync to [http] server', async () => {
      //
    });
  });
});
