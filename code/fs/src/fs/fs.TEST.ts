import { expect } from 'chai';
import { fs } from '.';
import { t } from '../common';

describe('fs', () => {
  describe('interface', () => {
    it('match', () => {
      const match = fs.match('**/*.js');
      expect(match.path('foo.js')).to.eql(true);
      expect(match.base('foo.txt')).to.eql(false);
    });

    it('env', () => {
      expect(typeof fs.env.load).to.eql('function');
    });
  });

  describe('file', () => {
    it('calculates the size of single file', async () => {
      const path = './src/fs/fs.TEST.ts';
      const res = await fs.size.file(path);
      expect(res.bytes).to.greaterThan(30);
      expect(res.path).to.eql(path);
    });

    it('toString', async () => {
      const res = await fs.size.file('./test/file/foo.json');
      expect(res.toString()).to.eql('20 B');
      expect(res.toString({ spacer: '' })).to.eql('20B');
    });
  });

  describe('dir', () => {
    it('calculates the size of a directory', async () => {
      const res = await fs.size.dir('./src');
      expect(res.files.length).to.greaterThan(5);
      expect(res.bytes).to.greaterThan(1000);
      expect(res.path).to.eql('./src');
    });

    it('toString', async () => {
      const res = await fs.size.dir('./test/file');
      expect(res.toString()).to.eql('827 B');
    });

    it('nothing when path does not exist', async () => {
      const res = await fs.size.dir('./NO_EXIST');
      expect(res.bytes).to.eql(0);
      expect(res.files).to.eql([]);
    });
  });

  describe('size.toString( bytes )', () => {
    it('converts to human readable size', () => {
      expect(fs.size.toString(123)).to.eql('123 B');
      expect(fs.size.toString(9999)).to.eql('9.76 KB');
      expect(fs.size.toString(9999, { spacer: '' })).to.eql('9.76KB');
      expect(fs.size.toString(9999, { round: 1 })).to.eql('9.8 KB');
      expect(fs.size.toString(9999, { round: 0 })).to.eql('10 KB');
    });
  });

  describe('IFs (interface)', () => {
    beforeEach(() => f.remove(f.resolve('tmp')));
    const f: t.IFs = fs;

    it('exists (resolve, join)', async () => {
      const res1 = await f.exists(f.resolve('tmp/no-exist'));
      const res2 = await f.exists(f.join(__dirname, 'fs.ts'));
      expect(res1).to.eql(false);
      expect(res2).to.eql(true);
    });

    it('ensureDir', async () => {
      const dir = f.resolve('tmp/ensure-dir');
      expect(await f.exists(dir)).to.eql(false);

      await f.ensureDir(dir);
      expect(await f.exists(dir)).to.eql(true);
    });

    it('read/write/copy', async () => {
      const text = 'Hello World';
      const path = f.resolve('tmp/file.txt');

      await f.ensureDir(f.resolve('tmp'));
      await f.writeFile(path, text);

      const read = await f.readFile(path);
      expect(read.toString()).to.eql(text);

      const copyPath = fs.resolve('tmp/copy.txt');
      await f.copyFile(path, copyPath);
      expect((await f.readFile(copyPath)).toString()).to.eql(text);
    });

    it('is (file/dir)', async () => {
      expect(await f.is.dir(f.resolve('tmp'))).to.eql(false);
      expect(await f.is.file(f.resolve('tmp/file'))).to.eql(false);

      await f.ensureDir(f.resolve('tmp'));
      await f.writeFile(f.resolve('tmp/file'), 'hello');

      expect(await f.is.dir(f.resolve('tmp'))).to.eql(true);
      expect(await f.is.file(f.resolve('tmp/file'))).to.eql(true);

      expect(await f.is.file(f.resolve('tmp'))).to.eql(false);
      expect(await f.is.dir(f.resolve('tmp/file'))).to.eql(false);
    });
  });
});
