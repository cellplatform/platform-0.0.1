import { Observable } from 'rxjs';
import { Arguments, Argv } from 'yargs';
import * as t from '../common/types';

export type CmdAppExit = (code: number) => void;
export type ICmdArgv<T extends Record<string, unknown> = any> = {
  [key in keyof Arguments<T>]: Arguments<T>[key];
};

/**
 * A command line application.
 */
export type ICmdApp = {
  events$: Observable<t.CmdAppEvent>;
  plugins: t.ICmdPlugins;
  keyboard: t.ICmdKeyboard;
  prompt: t.IPrompt;
  program: Argv<Record<string, unknown>>;
  command: Argv<Record<string, unknown>>['command'];
  option: Argv<Record<string, unknown>>['option'];
  task: t.AddTask;
  skip: t.AddTask;
  exit: CmdAppExit;
  run(): void;
};
