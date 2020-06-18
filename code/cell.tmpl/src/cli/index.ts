import { t } from '../common';
import { tmpl } from './cmd.tmpl';

export type ITmplArgs = {};

/**
 * Initialize Template command-line-interface (CLI).
 */
export const init: t.CmdPluginsInit = (cli) => {
  const handler: t.CmdPluginHandler<ITmplArgs> = async (e) => {
    const dir = process.cwd();
    await tmpl({ dir, install: true });
  };

  cli.command<ITmplArgs>({
    name: 'tmpl',
    alias: 't',
    description: 'Create from template.',
    handler,
  });

  return cli;
};
