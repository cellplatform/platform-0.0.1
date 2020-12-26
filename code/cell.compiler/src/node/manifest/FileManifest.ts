import { deleteUndefined, fs, Schema, t, DEFAULT } from '../common';
import { FileAccess, FileRedirects } from '../config';

type M = t.FsManifest;

/**
 * Create and write a new manifest to the file-system.
 */
const createAndSave = async <T extends M>(args: {
  sourceDir: string;
  filename?: string;
  model?: t.CompilerModel;
}) => {
  const { model, sourceDir, filename } = args;
  const manifest = await FileManifest.create<T>({ model, sourceDir });
  return write<T>({ manifest, dir: sourceDir, filename });
};

/**
 * Reads from file-system.
 */

const read = async <T extends M>(args: { dir: string; filename?: string }) => {
  const { dir, filename = FileManifest.filename } = args;
  const path = fs.join(dir, filename);
  const exists = await fs.pathExists(path);
  const manifest = exists ? ((await fs.readJson(path)) as T) : undefined;
  return { path, manifest };
};
/**
 * Writes a manifest to the file-system.
 */

const write = async <T extends M>(args: { manifest: T; dir: string; filename?: string }) => {
  const { manifest, dir, filename = FileManifest.filename } = args;
  const path = fs.join(dir, filename);
  const json = JSON.stringify(manifest, null, '  ');
  await fs.ensureDir(fs.dirname(path));
  await fs.writeFile(path, json);
  return { path, manifest };
};

/**
 * Helpers for creating and working with a [FileManifest].
 */
export const FileManifest = {
  createAndSave,
  read,
  write,

  /**
   * The filename of the bundle.
   */
  filename: DEFAULT.FILE.JSON.MANIFEST,

  /**
   * Generates a manifest.
   */
  async create<T extends M>(args: { sourceDir: string; model?: t.CompilerModel }) {
    const { model } = args;
    const sourceDir = (args.sourceDir || '').trim().replace(/\/*$/, '');
    const pattern = `${args.sourceDir}/**`;
    const paths = await fs.glob.find(pattern, { includeDirs: false });

    const toFile = (path: string) => FileManifest.loadFile({ path, sourceDir, model });
    const files: t.FsManifestFile[] = await Promise.all(paths.map((path) => toFile(path)));

    const manifest: M = {
      hash: FileManifest.hash(files),
      files,
    };

    return manifest as T;
  },

  /**
   * Calculate the hash for a set of fies.
   */
  hash(files: t.FsManifestFile[]) {
    const list = files.filter(Boolean).map((file) => file.filehash);
    return Schema.hash.sha256(list);
  },

  /**
   * Loads the file as the given path and derives file metadata.
   */
  async loadFile(args: {
    path: string;
    sourceDir: string;
    model?: t.CompilerModel;
  }): Promise<t.FsManifestFile> {
    const { model, sourceDir } = args;
    const file = await fs.readFile(args.path);
    const bytes = file.byteLength;
    const filehash = Schema.hash.sha256(file);
    const path = args.path.substring(sourceDir.length + 1);
    return deleteUndefined({
      path,
      bytes,
      filehash,
      allowRedirect: model ? toRedirect({ model, path }).flag : undefined,
      public: model ? toPublic({ model, path }) : undefined,
    });
  },
};

/**
 * Helpers
 */

function toRedirect(args: { model: t.CompilerModel; path: string }) {
  const redirects = FileRedirects(args.model.files?.redirects);
  return redirects.path(args.path);
}

function toAccess(args: { model: t.CompilerModel; path: string }) {
  const access = FileAccess(args.model.files?.access);
  return access.path(args.path);
}

function toPublic(args: { model: t.CompilerModel; path: string }) {
  const access = toAccess(args);
  return access.public ? true : undefined;
}
