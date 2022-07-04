import { fs } from '@platform/fs';
import { Vercel } from 'vendor.cloud.vercel/lib/node';

const token = process.env.VERCEL_TEST_TOKEN;

/**
 * https://vercel.com/docs/cli#project-configuration/routes
 *
 * Route regex:
 *    https://www.npmjs.com/package/path-to-regexp
 *
 */
export async function deploy(team: string, project: string, alias: string) {
  const dir = 'dist/web';
  await fs.copy('vercel.json', fs.join(dir, 'vercel.json'));

  const deployment = Vercel.Deploy({ token, dir, team, project });
  const info = await deployment.info();

  Vercel.Log.beforeDeploy({ info, alias, project });

  const res = await deployment.commit(
    { target: 'production', regions: ['sfo1'], alias },
    { ensureProject: true },
  );

  // Finish up.
  Vercel.Log.afterDeploy(res);
}
