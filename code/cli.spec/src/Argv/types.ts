export type CommandArgValue = string | number | boolean;
export type CommandArgsOptions = { [key: string]: CommandArgValue | undefined };

/**
 * Parsing `ARGV` strings.
 */
export type ICommandArgs<O extends CommandArgsOptions = any> = {
  params: CommandArgValue[];
  options: O;
};
