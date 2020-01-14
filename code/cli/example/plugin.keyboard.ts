import { log, t } from './libs';

export type IMyKeyboard = {
  silent: boolean;
};

/**
 * Initialize a plugin that reports keyboard events.
 */
export const init: t.CmdPluginsInit = cli => {
  const handler: t.CmdPluginHandler<IMyKeyboard> = async args => {
    const { keyboard } = args;

    log.info();
    log.info('keyboard started 🌳');
    log.info.gray('Hit any key to log events...');
    log.info();

    keyboard.keypress$.subscribe(e => {
      log.info('keypress', e);
    });
  };

  cli
    .command<IMyKeyboard>({
      name: 'keyboard',
      alias: 'k',
      description: 'Report keyboard events.',
      handler,
    })
    .option<'boolean'>({
      name: 'silent',
      alias: 's',
      description: 'No logging',
      type: 'boolean',
      default: false,
    });
};
