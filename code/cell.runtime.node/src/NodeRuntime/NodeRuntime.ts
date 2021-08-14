import { Subject } from 'rxjs';

import { BundleWrapper } from '../BundleWrapper';
import { BusController } from '../BusController';
import { BusEvents } from '../BusEvents';
import { fs, PATH, R, t, slug } from '../common';
import { pullMethod } from './NodeRuntime.pull';
import { runMethod } from './NodeRuntime.run';

export const NodeRuntime = {
  /**
   * Generates URLs for the given bundle.
   */
  urls(bundle: t.RuntimeBundleOrigin) {
    return BundleWrapper.urls(bundle);
  },

  /**
   * Initialize an instance of the Node runtime.
   */
  create(args: {
    bus: t.EventBus<any>;
    cachedir?: string;
    stdlibs?: t.RuntimeNodeAllowedStdlib[] | '*';
  }) {
    const { bus } = args;
    const id = `node:${slug()}`;
    const cachedir = args.cachedir || PATH.CACHE_DIR;
    const events = BusEvents({ bus, runtime: id });
    const controller = BusController({ bus, runtime: id });

    const isDisposed = () => runtime.isDisposed;
    const dispose$ = new Subject<void>();
    const dispose = () => {
      controller.dispose();
      events.dispose();
      runtime.isDisposed = true;
      dispose$.next();
      dispose$.complete();
    };

    const stdlibs =
      typeof args.stdlibs === 'string'
        ? (['*'] as t.RuntimeNodeAllowedStdlib[])
        : R.uniq(args.stdlibs ?? []);

    const runtime: t.RuntimeEnvNode = {
      id,
      name: 'cell.runtime.node',
      version: `node@${(process.version || '').replace(/^v/, '')}`,
      stdlibs,
      events,

      pull: pullMethod({ cachedir, isDisposed }),
      run: runMethod({ runtime: id, events, bus, cachedir, stdlibs, isDisposed }),

      /**
       * Determine if the given bundle has been pulled.
       */
      async exists(input) {
        if (runtime.isDisposed) throw new Error('Runtime disposed');
        return BundleWrapper.create(input, cachedir).isCached();
      },

      /**
       * Delete the given bundle (if it exists).
       */
      async remove(input) {
        if (runtime.isDisposed) throw new Error('Runtime disposed');
        const bundle = BundleWrapper.create(input, cachedir);
        const dir = bundle.cache.dir;
        let count = 0;
        if (await fs.pathExists(dir)) {
          count++;
          await fs.remove(dir);
        }
        return { count };
      },

      /**
       * Remove all bundles.
       */
      async clear() {
        if (runtime.isDisposed) throw new Error('Runtime disposed');
        const pattern = fs.join(cachedir, '*/*/*');
        const pulled = await fs.glob.find(pattern, { includeDirs: true });
        const count = pulled.length;
        await fs.remove(cachedir);
        return { count };
      },

      /**
       * Dispose
       */
      isDisposed: false,
      dispose$,
      dispose,
    };

    return runtime;
  },
};
