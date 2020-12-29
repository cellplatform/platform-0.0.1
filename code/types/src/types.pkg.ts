/**
 * NPM [package.json] file.
 */
export type INpmPackageJson = {
  name?: string;
  description?: string;
  version?: string;
  main?: string;
  types?: string;
  scripts?: INpmPackageFields;
  dependencies?: INpmPackageFields;
  devDependencies?: INpmPackageFields;
  peerDependencies?: INpmPackageFields;
  resolutions?: INpmPackageFields;
  license?: string;
  private?: boolean;
};

export type INpmPackageFields = { [key: string]: string };
export type NpmPackageFieldsKey =
  | 'scripts'
  | 'dependencies'
  | 'devDependencies'
  | 'peerDependencies'
  | 'resolutions';
