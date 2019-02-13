import { resolve } from 'path';
import { Subject } from 'rxjs';

import { exec, ITimer, time, value } from '../common';
import { yarn } from '../yarn';

export type Engine = 'YARN' | 'NPM';

export type INpmInstallResult = {
  elapsed: number;
  success: boolean;
  code: number;
  dir: string;
  engine: Engine;
  info: string[];
  errors: string[];
};

export type INpmInstallEvent = {
  type: 'INFO' | 'ERROR' | 'COMPLETE';
  result: INpmInstallResult;
  info?: string;
  error?: string;
};

/**
 * Runs an NPM or YARN install command.
 */
export async function install(
  args: {
    use?: Engine;
    dir?: string;
    silent?: boolean;
    events$?: Subject<INpmInstallEvent>;
  } = {},
) {
  const timer = time.timer();
  const { events$ } = args;
  const use = await toEngine(args.use);
  const dir = resolve(args.dir ? args.dir : '.');
  const cmd = await installCommand({ use });
  const silent = value.defaultValue(args.silent, true);

  let result: INpmInstallResult = {
    code: 0,
    success: true,
    elapsed: 0,
    engine: use,
    dir,
    info: [],
    errors: [],
  };

  const next = (type: INpmInstallEvent['type']) => {
    result = formatResult({ result, timer });
    if (events$) {
      const info = result.info[result.info.length - 1];
      const error = result.errors[result.errors.length - 1];
      events$.next({
        type,
        result,
        info,
        error,
      });
    }
  };

  const addError = (text: string) => {
    if (text) {
      const errors = [...result.errors, formatErrorLine(text)];
      result = { ...result, errors };
    }
  };

  const onData = (data: Buffer, isError: boolean) => {
    const text = formatInfoLine(data.toString());
    isError = isErrorText(text) ? true : isError;
    if (isError) {
      text.split('\n').forEach(line => addError(line));
    } else {
      result.info = [...result.info, text];
    }
    next(isError ? 'ERROR' : 'INFO');
  };

  // Run the command.
  const child = exec.run(`cd ${dir} \n ${cmd}`, { silent });
  child.stdout.on('data', (data: Buffer) => onData(data, false));
  child.stderr.on('data', (data: Buffer) => onData(data, true));

  // Finish up.
  await child;
  next('COMPLETE');
  return result;
}

/**
 * INTERNAL
 */

function formatInfoLine(text: string) {
  return text.replace(/\n$/, '').trim();
}

function formatErrorLine(text: string) {
  return text
    .replace(/^error/, '')
    .replace(/^ERROR\:/, '')
    .replace(/\n$/, '')
    .trim();
}

function isErrorText(text: string) {
  return text.startsWith('ERROR:');
}

async function toEngine(use?: Engine) {
  if (use) {
    return use;
  }
  return (await yarn.isInstalled()) ? 'YARN' : 'NPM';
}

async function installCommand(args: { use: Engine }) {
  const use = await toEngine(args.use);
  switch (use) {
    case 'NPM':
      return 'npm install';
    case 'YARN':
      return 'yarn install';
    default:
      throw new Error(`Engine '${use}' not supported.`);
  }
}

function getExitCode(errors: string[]) {
  let code = 0;
  let fail = errors.find(line => line.includes('failed with exit code'));
  if (fail) {
    fail = fail.replace(/\.$/, '');
    const parts = fail.split(' ');
    code = value.toNumber(parts[parts.length - 1]);
  }
  return code === 0 && errors.length > 0 ? 1 : code;
}

function formatResult(args: {
  result: INpmInstallResult;
  timer: ITimer;
  use?: Engine;
}): INpmInstallResult {
  const { timer, result } = args;
  const code = getExitCode(result.errors);
  const success = code === 0;
  const elapsed = timer.elapsed();
  const engine = args.use || result.engine;
  return { ...result, code, success, elapsed, engine };
}
