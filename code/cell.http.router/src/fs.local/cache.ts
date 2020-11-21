import { fs, constants } from '../common';

/**
 * Local file-system cache.
 */
export function fileCache(args: { hash: string }) {
  const { hash } = args;

  let path = '';
  const cache = {
    hash,
    get path() {
      if (!path) {
        const dir = constants.PATH.CACHE_DIR;
        path = fs.join(dir, hash);
      }
      return path;
    },

    async exists() {
      return fs.pathExists(cache.path);
    },

    async get() {
      const exists = await cache.exists();
      return exists ? fs.readFile(cache.path) : undefined;
    },

    async put(data: string | Buffer) {
      const path = cache.path;
      await fs.ensureDir(fs.dirname(path));
      await fs.writeFile(path, data);
    },
  };

  return cache;
}
