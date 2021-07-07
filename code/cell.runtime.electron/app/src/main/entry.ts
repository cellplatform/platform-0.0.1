import { app } from 'electron';

import { ConfigFile, constants, fs, Genesis, HttpClient, log, rx, t, time } from './common';
import { Bundle } from './main.Bundle';
import { Log } from './main.Log';
import { Menu } from './main.Menu';
import { BuildMenu } from './main.Menu.instance';
import { System } from './main.System';
import { SystemServer } from './main.System.server';
import { Window } from './main.Window';

import { TestIpcBusBridging } from './entry.TMP';

const { ENV, Paths } = constants;

/**
 * Ensure all renderer processes are opened in "sandbox" mode.
 * https://www.electronjs.org/docs/tutorial/sandbox#enabling-the-sandbox-globally
 */
app.enableSandbox();

/**
 * Startup the application.
 */
export async function start() {
  const timer = time.timer();

  // Ensure the NODE_ENV value is cleanly set to "production" if packaged.
  if (app.isPackaged || ENV.isProd) process.env.NODE_ENV = 'production';
  const prod = ENV.isProd;

  log.info.gray('━'.repeat(60));

  try {
    // Start the HTTP server.
    const port = prod ? undefined : 5000;
    const { paths, host } = await SystemServer.start({ log, prod, port });

    // Initialize the HTTP client.
    const http = HttpClient.create(host);
    http.request$.subscribe((e) => {
      /**
       * TODO 🐷
       * Add a "security token" to lock down the server to the app only.
       * See `SystemServer` for the other-side that checks the token before responding.
       */
    });

    // Load the configuration JSON file.
    const config = await ConfigFile.read();
    const genesis = Genesis(http);

    // Wait for electron to finish starting.
    await app.whenReady();
    await genesis.cell.ensureExists();

    /**
     * Prepare buses.
     */
    const bus = rx.bus<t.ElectronRuntimeEvent>();

    /**
     * TEMP 🐷
     *  - bridge between [ipcBus] and [mainBus]
     */
    TestIpcBusBridging({ bus });

    /**
     * Initialize controllers.
     */
    System.Controller({ bus, host, paths, config });
    Bundle.Controller({ bus, http });
    Window.Controller({ bus });
    Log.Controller({ bus });
    Menu.Controller({ bus });

    /**
     * Upload bundled system code into the local service.
     */
    const bundle = Bundle.Events({ bus });
    const res = await bundle.install.fire(fs.join(Paths.bundle.sys.source, 'index.json'), {
      force: ENV.isDev, // NB: Only repeat upload when running in development mode.
    });

    console.log('installed module:', res);

    // const bundleStatus = await bundle.status.get({ dir: Paths.bundle.sys.target });
    // console.log('-------------------------------------------');
    // console.log('bundleStatus', bundleStatus);

    const preload = Paths.preload;
    await logMain({ http, paths: { data: paths, preload } });

    // await menu.build({ bus, paths, port: instance.port });
    BuildMenu({ bus, http }).load();

    const sysEvents = System.Events({ bus });
    const sysStatus = await sysEvents.status.get();
    // log.info('System Status', sysStatus);

    /**
     * Finish up.
     */
    await ConfigFile.log.updateStarted();
    log.info.gray(`✨ ${log.white('Startup Complete')} (${timer.elapsed.toString()})`);
  } catch (error) {
    log.error('🐷 Failed on startup:');
    log.error(error);
  }
}

/**
 * [Helpers]
 */

async function logMain(args: {
  http: t.IHttpClient;
  paths: { preload: string; data: t.ElectronDataPaths };
}) {
  const genesis = Genesis(args.http);
  const host = args.http.origin;

  const table = log.table({ border: false });
  const line = () => table.add(['', '']);
  const add = (key: string, value: any) => {
    key = ` • ${log.green(key)} `;
    table.add([key, value]);
  };

  const isDev = ENV.isDev;

  const toSize = async (path: string) => {
    const exists = await fs.exists(path);
    return exists ? (await fs.size.file(path)).toString({ round: 0, spacer: '' }) : '0B';
  };

  const path = async (input: string) => {
    let output = input;
    if (isDev) {
      const prefix = fs.resolve('..');
      output = output.startsWith(prefix) ? output.substring(prefix.length + 1) : output;
    }
    if (isDev) {
      const size = await toSize(input);
      output = `${output} ${log.blue(size)}`;
    }
    return output;
  };

  const process = ConfigFile.process.split('@');

  add('runtime:', `${Format.namespace(process[0])}@${process[1]}`);
  add('env:', ENV.node || '<empty>');
  add('packaged:', ENV.isPackaged);
  line();
  add('preload:', await path(args.paths.preload));
  add('log:', await path(args.paths.data.log));
  add('db:', await path(args.paths.data.db));
  add('fs:', await path(args.paths.data.fs));
  add('config:', await path(args.paths.data.config));
  line();
  add('host:', log.cyan(`http:${host.split(':')[1]}:${log.white(host.split(':')[2])}`));
  add('genesis', await genesis.cell.url());
  add('registry', await genesis.modules.url());

  log.info.gray(`
${log.white('main')}:
${table.toString()}
`);
}

const Format = {
  namespace(input: string) {
    const parts = (input || '').trim().split('.');
    const formatted = parts.map((part, i) => (i === parts.length - 1 ? log.white(part) : part));
    return log.cyan(formatted.join('.'));
  },
};
