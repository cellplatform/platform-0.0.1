import { t, expect, http, RouterMock, TestPost } from '../../test';

describe('cell: coordinate routes (CELL | ROW | COL)', () => {
  describe('invalid URI', () => {
    it('malformed: cell coordinate (A1) as namespace', async () => {
      const test = async (path: string, msg: string) => {
        const mock = await RouterMock.create();
        const res = await http.get(mock.url(path));
        const body = res.json as any;

        await mock.dispose();

        expect(res.status).to.eql(500);
        expect(body.type).to.eql('HTTP/server');
        expect(body.message).to.contain(msg, path);
      };

      await test('/cell:bumble', `URI contains an invalid "ns" identifier`);

      await test('/cell:A1', 'URI contains an invalid "ns" identifier');
      await test('/cell:A', 'URI contains an invalid "ns" identifier');
      await test('/cell:1', 'Namespace URI identifier not found');
    });

    it('malformed: no namespace id', async () => {
      const test = async (path: string) => {
        const mock = await RouterMock.create();
        const res = await http.get(mock.url(path));
        const body = res.json as any;

        await mock.dispose();

        expect(res.status).to.eql(400);
        expect(body.error.type).to.eql('HTTP/uri/malformed');
        expect(body.error.message).to.contain('Malformed');
        expect(body.error.message).to.contain('does not contain a namespace-identifier');
      };

      await test('/cell::A1');
      await test('/cell::1');
      await test('/cell::A');
    });
  });

  describe('does not exist (200, exists:false)', () => {
    const test = async (uri: string) => {
      const mock = await RouterMock.create();
      const res = await http.get(mock.url(uri));
      await mock.dispose();

      const body = res.json as t.IResGetCoord;

      expect(body.uri).to.eql(uri);
      expect(body.exists).to.eql(false);
      expect(body.createdAt).to.eql(-1);
      expect(body.modifiedAt).to.eql(-1);
      expect(body.data).to.eql({});
    };

    it('cell:foo:A1 (cell)', async () => {
      await test('cell:foo:A1');
    });

    it('cell:foo:1 (row)', async () => {
      await test('cell:foo:1');
    });

    it('cell:foo:A (column)', async () => {
      await test('cell:foo:A');
    });
  });

  describe('GET', () => {
    it('redirects from "cell:" to "ns:" end-point', async () => {
      const test = async (path: string) => {
        const mock = await RouterMock.create();
        await mock.client.ns('foo').write({ ns: { title: 'Hello' } }); // NB: Force the URI into existence in the DB.
        const res = await http.get(mock.url(path));
        await mock.dispose();

        const json = res.json as t.IResGetNs;
        expect(json.uri).to.eql('ns:foo'); // NB: The "ns:" URI, not "cell:".
        expect(res.status).to.eql(200);
        expect(json.exists).to.eql(true);
        expect(json.data.ns.id).to.eql('foo');
      };

      await test('/cell:foo');
      await test('/cell:foo/');
      await test('/cell:foo?cells');
    });
  });

  describe('cell:', () => {
    it('cell', async () => {
      const mock = await RouterMock.create();
      await TestPost.ns('ns:foo', { cells: { A1: { value: 123 } } }, { mock });

      const uri = 'cell:foo:A1';
      const res = await http.get(mock.url(uri));
      await mock.dispose();

      const body = res.json as t.IResGetCell;
      const data = body.data;

      expect(body.uri).to.eql(uri);
      expect(body.exists).to.eql(true);
      expect(body.createdAt).to.not.eql(-1);
      expect(body.modifiedAt).to.not.eql(-1);

      expect(data.value).to.eql(123);
      expect(data.hash).to.match(/^sha256-([a-z0-9]{60,})/);
    });

    it('column', async () => {
      const mock = await RouterMock.create();
      await TestPost.ns('ns:foo', { columns: { A: { props: { width: 123 } } } }, { mock });

      const uri = 'cell:foo:A';
      const res = await http.get(mock.url(uri));
      await mock.dispose();

      const body = res.json as t.IResGetColumn;
      const data = body.data;

      expect(body.uri).to.eql(uri);
      expect(body.exists).to.eql(true);
      expect(body.createdAt).to.not.eql(-1);
      expect(body.modifiedAt).to.not.eql(-1);

      expect(data.props).to.eql({ width: 123 });
      expect(data.hash).to.match(/^sha256-([a-z0-9]{60,})/);
    });

    it('row', async () => {
      const mock = await RouterMock.create();
      await TestPost.ns('ns:foo', { rows: { 1: { props: { height: 80 } } } }, { mock });

      const uri = 'cell:foo:1';
      const res = await http.get(mock.url(uri));
      await mock.dispose();

      const body = res.json as t.IResGetRow;
      const data = body.data;

      expect(body.uri).to.eql(uri);
      expect(body.exists).to.eql(true);
      expect(body.createdAt).to.not.eql(-1);
      expect(body.modifiedAt).to.not.eql(-1);

      expect(data.props).to.eql({ height: 80 });
      expect(data.hash).to.match(/^sha256-([a-z0-9]{60,})/);
    });
  });
});
