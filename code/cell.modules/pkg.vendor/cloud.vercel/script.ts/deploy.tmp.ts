import { Vercel } from 'vendor.vercel/lib/node';

const token = process.env.VERCEL_TEST_TOKEN;

/**
 * https://vercel.com/docs/cli#project-configuration/routes
 *
 * Route regex:
 *    https://www.npmjs.com/package/path-to-regexp
 *
 */
async function deploy(team: string, project: string, alias?: string) {
  const deployment = Vercel.Deploy({ token, dir: 'dist/node.server', team, project });
  const manifest = await deployment.manifest<t.ModuleManifest>();

  console.log('deploying:');
  console.log(' • manifest', manifest);

  const wait = deployment.push({
    // target: 'production',
    regions: ['sfo1'],
    alias,
    // routes: [{ src: '/foo', dest: '/' }],
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

// DEV
deploy('tdb', 'tmp');
