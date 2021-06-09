import { fs, PATH } from '../common';

export const util = {
  /**
   * Ensure the config directory exists.
   */
  async ensureConfigDir(args: { dir?: string } = {}) {
    const dir = args.dir || PATH.CONFIG_DIR;
    await fs.ensureDir(dir);
    await util.renameToYml({ dir });
    return dir;
  },
  /**
   * Rename all YAML files within the directory to `.yml`
   */
  async renameToYml(args: { dir?: string } = {}) {
    const dir = args.dir || PATH.CONFIG_DIR;
    const names = (await fs.readdir(dir)).filter((name) => name.endsWith('.yaml'));

    const renamed: { from: string; to: string }[] = [];
    for (const name of names) {
      const from = fs.join(dir, name);
      const to = fs.join(dir, `${name.replace(/\.yaml$/, '')}.yml`);
      await fs.rename(from, to);
      renamed.push({ from, to });
    }
    return { renamed };
  },
};
