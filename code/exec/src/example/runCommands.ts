/* eslint-disable */

import { exec } from '..';
import * as chalk from 'chalk';

export async function run() {
  const colorNames = ['cyan', 'magenta'];
  const colors = colorNames.map((color) => chalk[color](color));

  const cmd1 = 'echo foo';
  const cmd2 = 'I will fail 😣';
  const cmd3 = `echo ${colors.join(' ')}`;
  const res = await exec.cmd.runList([cmd1, cmd2, cmd3]);

  console.log('-------------------------------------------');

  const toMessage = (error?: Error) => (error ? error.message : undefined);
  const results = res.results.map((res) => ({ ...res }));
  console.log({ ...res, results, error: toMessage(res.error) });
}
