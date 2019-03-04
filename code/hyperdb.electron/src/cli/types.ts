import { ICommand } from './libs';

/**
 * Manages state of a CLI program.
 */
export type ICommandState<P extends object = any> = ICommandStateProps<P> & {
  toString(): string;
  toObject(): ICommandStateProps<P>;
};

export type ICommandStateProps<P extends object = any> = {
  text: string;
  command: ICommand | undefined;
};

export type IParsedCommand<P extends object = any> = {
  commands: string[];
  params: P;
};

/**
 * Change delegate.
 */
export type CommandChangeDispatcher = (e: ICommandChangeArgs) => void;
export type ICommandChangeArgs = {
  readonly text: string;
  readonly invoked?: boolean;
};

/**
 * [Events]
 */
export type CommandEvent = ICommandChangeEvent | ICommandInvokeEvent;

export type ICommandChangeEvent<P extends object = any> = {
  type: 'COMMAND/change';
  payload: ICommandStateProps<P>;
};

export type ICommandInvokeEvent<P extends object = any> = {
  type: 'COMMAND/invoke';
  payload: ICommandStateProps<P>;
};
