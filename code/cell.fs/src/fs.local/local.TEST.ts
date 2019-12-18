import { t, expect, util, PATH } from '../test';
import { local } from '.';

const init = () => local.init({ root: PATH.LOCAL });

describe('fs.local', () => {
  it('type', () => {
    const fs = init();
    expect(fs.type).to.eql('FS');
  });

  describe('paths', () => {
    it('exposes root (dir)', () => {
      const fs = init();
      expect(fs.root).to.eql(PATH.LOCAL);
    });

    it('resolve URI to path', () => {
      const fs = init();
      const test = (uri: string, expected: string) => {
        const res = fs.resolve(uri);
        expect(res).to.eql(`${PATH.LOCAL}/${expected}`);
      };
      test('file:foo:123', 'ns.foo/123');
      test('file:ck3jldh1z00043fetc11ockko:1z53tcj', 'ns.ck3jldh1z00043fetc11ockko/1z53tcj');
    });
  });

  it('write file', async () => {
    await util.reset();
    const fs = init();

    const png = await util.image('bird.png');
    const uri = 'file:foo:bird';
    const res = await fs.write(`  ${uri} `, png); // NB: URI padded with spaces (corrected internally).
    const file = res.file;

    expect(res.ok).to.eql(true);
    expect(res.status).to.eql(200);
    expect(res.error).to.eql(undefined);
    expect(res.location).to.eql(`file://${file.path}`);
    expect(file.uri).to.eql(uri);
    expect(file.path).to.eql(fs.resolve(uri));
    expect(file.hash).to.match(/^sha256-[a-z0-9]+/);
    expect(png.toString()).to.eql((await util.fs.readFile(file.path)).toString());
  });

  it('read file', async () => {
    await util.reset();
    const fs = init();

    const png = await util.image('bird.png');
    const uri = 'file:foo:bird';
    const path = fs.resolve(uri);
    await util.fs.ensureDir(util.fs.dirname(path));
    await util.fs.writeFile(path, png);

    const res = await fs.read(uri);
    const file = res.file as t.IFileSystemFile;

    expect(res.ok).to.eql(true);
    expect(res.status).to.eql(200);
    expect(res.error).to.eql(undefined);
    expect(res.location).to.eql(`file://${file.path}`);
    expect(file.path).to.eql(path);
    expect(file.data.toString()).to.eql((await util.fs.readFile(file.path)).toString());
    expect(file.hash).to.match(/^sha256-[a-z0-9]+/);
  });

  it('delete file (one)', async () => {
    await util.reset();
    const fs = init();

    const png = await util.image('bird.png');
    const uri = 'file:foo:bird';
    const path = fs.resolve(uri);

    expect(await util.fs.pathExists(path)).to.eql(false);
    await fs.write(uri, png);
    expect(await util.fs.pathExists(path)).to.eql(true);

    const res = await fs.delete(uri);
    expect(await util.fs.pathExists(path)).to.eql(false);

    expect(res.ok).to.eql(true);
    expect(res.status).to.eql(200);
    expect(res.locations[0]).to.eql(`file://${path}`);
  });

  it('delete file (many)', async () => {
    await util.reset();
    const fs = init();

    const png = await util.image('bird.png');
    const jpg = await util.image('kitten.jpg');
    const uri1 = 'file:foo:bird';
    const uri2 = 'file:foo:kitten';
    const path1 = fs.resolve(uri1);
    const path2 = fs.resolve(uri2);

    expect(await util.fs.pathExists(path1)).to.eql(false);
    expect(await util.fs.pathExists(path2)).to.eql(false);

    await fs.write(uri1, png);
    await fs.write(uri2, jpg);
    expect(await util.fs.pathExists(path1)).to.eql(true);
    expect(await util.fs.pathExists(path2)).to.eql(true);

    const res = await fs.delete([uri1, uri2]);

    expect(await util.fs.pathExists(path1)).to.eql(false);
    expect(await util.fs.pathExists(path2)).to.eql(false);

    expect(res.ok).to.eql(true);
    expect(res.status).to.eql(200);
    expect(res.locations[0]).to.eql(`file://${path1}`);
    expect(res.locations[1]).to.eql(`file://${path2}`);
  });

  describe('errors', () => {
    it('404 while reading file', async () => {
      await util.reset();
      const fs = init();
      const uri = 'file:foo:noexist';

      const res = await fs.read(uri);
      const error = res.error as t.IFileSystemError;

      expect(res.ok).to.eql(false);
      expect(res.status).to.eql(404);
      expect(res.file).to.eql(undefined);
      expect(error.type).to.eql('FS/read/404');
      expect(error.path).to.eql(fs.resolve(uri));
      expect(error.message).to.contain(`[file:foo:noexist] does not exist`);
    });
  });
});
