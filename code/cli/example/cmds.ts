#!/usr/bin/env node
import { cli, log, time } from './libs';

/**
 * Initialize.
 */
const app = cli.create('my-app');

/**
 * Configure.
 */
app
  .command(
    ['init', 'i'],
    'Initialize the thing.',
    yargs =>
      yargs.option('force', {
        alias: 'f',
        describe: 'Overwrite existing files.',
        boolean: true,
      }),
    argv => {
      const { force } = argv;
      log.info();
      log.info('🌼  init', argv);
      log.info();
    },
  )
  .command(
    'spin',
    'Sample spinning list',
    yargs => yargs,
    async argv => {
      log.info();
      log.info('🐷  foo', argv);
      log.info();

      const res = await app
        .task('sync', () => true)
        .task('wait', async e => time.wait(1200))
        .task('wait/done', async e => {
          await time.wait(500);
          e.done();
          e.done();
          e.done();
        })
        .task('fail (via exception)', async e => {
          await time.wait(500);
          throw new Error('My error message');
        })
        .task('fail (via e.error)', async e => {
          await time.wait(800);
          e.error('Fail message');
        })
        .task('messages', async e => {
          const items = Array.from({ length: 5 }).map((v, i) => i + 1);
          for (const item of items) {
            e.message(`Message ${item}`);
            await time.wait(800);
          }
        })
        .run({ concurrent: true, silent: false, exitOnError: false });

      log.info.gray('\n-------------------------------------------');
      log.info('res', res);
      log.info();

      cli.exit(res.code);
    },
  );

/**
 * Run.
 */
app.run();
