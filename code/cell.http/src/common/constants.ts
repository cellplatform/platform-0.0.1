import { PKG } from './constants.pkg';
import { fs } from './libs';

export { ERROR } from '@platform/cell.schema';

export const IS_CLOUD = Boolean(process.env.VERCEL_URL);
export const PATH = {
  MODULE: fs.join(__dirname, '../../..'),
  TMP: IS_CLOUD ? '/tmp' : fs.resolve('tmp'),
};

/**
 * Versions (from PACKAGE.json)
 */
export { PKG };
const DEPS = PKG.dependencies;

const toVersion = (input: string) => (input || '').split('@')[2];
export function getSystem() {
  const versions = getVersions();
  const server = toVersion(versions.server);
  const schema = toVersion(versions.schema);
  const router = toVersion(versions.router);
  const system = `server@${server}; router@${router} schema@${schema}`;
  return {
    system,
    ...versions,
  };
}

export function getVersions() {
  const depVersion = (key: string, version?: string) => {
    version = version || DEPS[key] || '-';
    version = (version || '').replace(/^\^/, '').replace(/^\~/, '');
    return `${key}@${version}`;
  };
  const version = {
    schema: depVersion('@platform/cell.schema'),
    types: depVersion('@platform/cell.types'),
    server: depVersion('@platform/cell.http', PKG.version),
    router: depVersion('@platform/cell.http.router'),
    toVersion,
  };

  return version;
}
