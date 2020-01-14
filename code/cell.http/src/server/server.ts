import { Observable, Subject, BehaviorSubject } from 'rxjs';
import {
  takeUntil,
  take,
  takeWhile,
  map,
  filter,
  share,
  delay,
  distinctUntilChanged,
  debounceTime,
} from 'rxjs/operators';
import { t, micro, constants, log, util, value, Schema } from './common';
import * as router from './router';

export { Config } from './config';

const { PKG } = constants;

/**
 * Initializes a new server instance.
 */
export function init(args: {
  db: t.IDb;
  fs: t.IFileSystem;
  title?: string;
  deployedAt?: number | string;
  log?: Array<'ROUTES'>;
}) {
  const { db, title, fs } = args;
  const logTypes = args.log || [];
  const base = util.fs.resolve('.');
  const root = fs.root.startsWith(base) ? fs.root.substring(base.length) : fs.root;
  const deployedAt =
    typeof args.deployedAt === 'string' ? value.toNumber(args.deployedAt) : args.deployedAt;

  // Setup the micro-service.
  const deps = PKG.dependencies || {};
  const app = micro.init({
    cors: true,
    log: {
      module: `${log.white(PKG.name)}@${PKG.version}`,
      schema: log.green(deps['@platform/cell.schema']),
      fs: `[${fs.type === 'LOCAL' ? 'local' : fs.type}]${root}`,
    },
  });

  // Routes.
  router.init({
    title,
    db,
    fs,
    router: app.router,
    deployedAt,
  });

  // Prepare headers before final response is sent to client.
  app.response$.subscribe(e => {
    // Add default cache headers.
    let headers = e.res.headers || {};

    /**
     * TODO 🐷
     * - Cache-Control: only for data API, allow caching for the UI routes.
     */

    if (!headers['Cache-Control']) {
      headers = {
        ...headers,
        'cache-control': 'no-cache', // Ensure the data-api responses reflect current state of data.
        // 'Cache-Control': 's-maxage=1, stale-while-revalidate', // See https://zeit.co/docs/v2/network/caching/#stale-while-revalidate
      };
      e.modify({ ...e.res, headers });
    }
  });

  // Log routes.
  app.events$
    .pipe(
      filter(() => logTypes.includes('ROUTES')),
      filter(e => e.type === 'HTTP/started'),
    )
    .subscribe(e => log.info(app.router.log({ indent: 3 })));

  // Finish up.
  return app;
}
