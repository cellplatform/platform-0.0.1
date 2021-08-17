import { asArray, BusEvents, rx, t, Format } from './common';

type FilesystemId = string;
type Error = t.SysFsError;
type MaybeError = Error | undefined;
type FilePath = string;

/**
 * Event controller.
 */
export function BusController(args: {
  id: FilesystemId;
  fs: t.IFilesystemLocal;
  bus: t.EventBus<any>;
  filter?: (e: t.SysFsEvent) => boolean;
}) {
  const { id, fs } = args;

  const bus = rx.busAsType<t.SysFsEvent>(args.bus);
  const events = BusEvents({ id, bus, filter: args.filter });
  const { dispose, dispose$ } = events;

  const stripDirPrefix = (path: FilePath) => Format.dir.stripPrefix(fs.dir, path);

  const getFileInfo = async (filepath: FilePath): Promise<t.SysFsFileInfo> => {
    try {
      const uri = Format.path.ensurePrefix(filepath);
      const res = await fs.info(uri);
      const { exists, hash, bytes } = res;
      const path = stripDirPrefix(res.path);
      return { path, exists, hash, bytes };
    } catch (err) {
      const error: t.SysFsError = { code: 'info', message: err.message };
      return { path: filepath, exists: null, hash: '', bytes: -1, error };
    }
  };

  const readFile = async (filepath: string): Promise<t.SysFsFileReadResponse> => {
    const address = Format.path.ensurePrefix(filepath);
    const res = await fs.read(address);

    if (res.error) {
      const error: Error = { code: 'read', message: res.error.message };
      return { error };
    }

    if (!res.file) {
      const error: Error = { code: 'read', message: `File not found. ${filepath}` };
      return { error };
    }

    const { hash, data } = res.file;
    const path = res.file.path;
    return {
      file: { path, data, hash },
    };
  };

  const writeFile = async (file: t.SysFsFile): Promise<t.SysFsFileWriteResponse> => {
    const { data } = file;
    const address = Format.path.ensurePrefix(file.path);
    const res = await fs.write(address, data);
    const error: MaybeError = res.error ? { code: 'write', message: res.error.message } : undefined;
    return {
      path: stripDirPrefix(res.file.path),
      error,
    };
  };

  const copyFile = async (file: t.SysFsFileTarget): Promise<t.SysFsFileCopyResponse> => {
    const source = Format.path.ensurePrefix(file.source);
    const target = Format.path.ensurePrefix(file.target);
    const res = await fs.copy(source, target);
    const error: MaybeError = res.error ? { code: 'copy', message: res.error.message } : undefined;
    return {
      source: stripDirPrefix(file.source),
      target: stripDirPrefix(file.target),
      error,
    };
  };

  const deleteFile = async (filepath: FilePath): Promise<t.SysFsFileDeleteResponse> => {
    const address = Format.path.ensurePrefix(filepath);
    const res = await fs.delete(address);
    const error: MaybeError = res.error
      ? { code: 'delete', message: res.error.message }
      : undefined;
    return {
      path: stripDirPrefix(res.locations[0]),
      error,
    };
  };

  const moveFile = async (file: t.SysFsFileTarget): Promise<t.SysFsFileMoveResponse> => {
    let error: MaybeError;

    if (!error) {
      const res = await copyFile(file);
      if (res.error) error = res.error;
    }

    if (!error) {
      const res = await deleteFile(file.source);
      if (res.error) error = res.error;
    }

    return {
      source: stripDirPrefix(file.source),
      target: stripDirPrefix(file.target),
      error,
    };
  };

  /**
   * Info (Module)
   */
  events.info.req$.subscribe(async (e) => {
    const { tx } = e;
    const info: t.SysFsInfo = { id, dir: fs.dir };
    const paths = asArray(e.path ?? []);
    const files = await Promise.all(paths.map(getFileInfo));

    bus.fire({
      type: 'sys.fs/info:res',
      payload: { tx, id, fs: info, files },
    });
  });

  /**
   * IO: Read
   */
  events.io.read.req$.subscribe(async (e) => {
    const { tx } = e;
    const files = await Promise.all(asArray(e.path).map(readFile));
    const error: MaybeError = files.some((file) => Boolean(file.error))
      ? { code: 'read', message: 'Failed while reading' }
      : undefined;

    bus.fire({
      type: 'sys.fs/read:res',
      payload: { tx, id, files, error },
    });
  });

  /**
   * IO: Write
   */
  events.io.write.req$.subscribe(async (e) => {
    const { tx } = e;
    const files = await Promise.all(asArray(e.file).map(writeFile));
    const error: MaybeError = files.some((file) => Boolean(file.error))
      ? { code: 'write', message: 'Failed while writing' }
      : undefined;

    bus.fire({
      type: 'sys.fs/write:res',
      payload: { tx, id, files, error },
    });
  });

  /**
   * IO: Delete
   */
  events.io.delete.req$.subscribe(async (e) => {
    const { tx } = e;
    const files = await Promise.all(asArray(e.path).map(deleteFile));
    const error: MaybeError = files.some((file) => Boolean(file.error))
      ? { code: 'delete', message: 'Failed while deleting' }
      : undefined;

    bus.fire({
      type: 'sys.fs/delete:res',
      payload: { tx, id, files, error },
    });
  });

  /**
   * IO: Copy
   */
  events.io.copy.req$.subscribe(async (e) => {
    const { tx } = e;
    const files = await Promise.all(asArray(e.file).map(copyFile));
    const error: MaybeError = files.some((file) => Boolean(file.error))
      ? { code: 'copy', message: 'Failed while copying' }
      : undefined;

    bus.fire({
      type: 'sys.fs/copy:res',
      payload: { tx, id, files, error },
    });
  });

  /**
   * IO: Move
   */
  events.io.move.req$.subscribe(async (e) => {
    const { tx } = e;
    const files = await Promise.all(asArray(e.file).map(moveFile));
    const error: MaybeError = files.some((file) => Boolean(file.error))
      ? { code: 'move', message: 'Failed while moving' }
      : undefined;

    bus.fire({
      type: 'sys.fs/move:res',
      payload: { tx, id, files, error },
    });
  });

  return { id, dispose, dispose$ };
}
