import { asArray, BusEvents, rx, t, Format } from './common';
import { BusControllerIo } from './BusController.io';
import { BusControllerIndex } from './BusController.index';

type FilesystemId = string;
type FilePath = string;

/**
 * Event controller.
 */
export function BusController(args: {
  id: FilesystemId;
  fs: t.IFsLocal;
  index: t.FsIndexer;
  bus: t.EventBus<any>;
  filter?: (e: t.SysFsEvent) => boolean;
}) {
  const { id, fs, index } = args;

  const bus = rx.busAsType<t.SysFsEvent>(args.bus);
  const events = BusEvents({ id, bus, filter: args.filter });
  const { dispose, dispose$ } = events;

  BusControllerIo({ id, fs, bus, events });
  BusControllerIndex({ id, index, fs, bus, events });

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

  return { id, dispose, dispose$ };
}
