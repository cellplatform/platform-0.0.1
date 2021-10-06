import { Vercel } from 'vendor.cloud.vercel/lib/node';

const token = process.env.VERCEL_TEST_TOKEN;

/**
 * https://vercel.com/docs/cli#project-configuration/routes
 *
 * Route regex:
 *    https://www.npmjs.com/package/path-to-regexp
 *
 */
async function deploy(team: string, project: string, dir: string, alias?: string) {
  const deployment = Vercel.Deploy({ token, dir, team, project });
  const manifest = await deployment.manifest<t.ModuleManifest>();

  console.log('deploying:');
  // console.log(' • manifest', );

  const wait = deployment.commit({
    // target: alias ? 'production' : 'staging',
    regions: ['sfo1'],
    alias,
  });

  const res = await wait;
  const status = res.status;
  const name = res.deployment.name;

  console.log(res.deployment);
  console.log('-------------------------------------------');
  console.log(status);
  console.log(name);
  console.log();

  return { status, name };
}

// tmp.node
deploy('tdb', 'tmp', 'dist/node', 'foo.tmp.db.team');
