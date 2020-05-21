import { json } from 'body-parser';
import * as express from 'express';

import { fs, t } from '../common';
import * as router from '../router';

/**
 * Initializes a new base web server.
 */
export function init(args: {
  name: string;
  downloadDir: string;
  prerelease?: t.NpmPrerelease;
  urlPrefix?: string;
  NPM_TOKEN?: string;
}) {
  const { name, NPM_TOKEN } = args;
  const prerelease = args.prerelease || false;
  const downloadDir = fs.resolve(args.downloadDir);

  let urlPrefix = args.urlPrefix || '';
  urlPrefix = urlPrefix.replace(/^\//, '').replace(/\/$/, '');
  urlPrefix = `/${urlPrefix}`;

  const getContext: t.GetNpmRouteContext = async () => {
    return { name, downloadDir, prerelease, NPM_TOKEN };
  };

  // Ensure download folder is setup.
  fs.ensureDirSync(downloadDir);
  const npmrc = fs.resolve(fs.join(downloadDir, '.npmrc'));
  if (!fs.pathExistsSync(npmrc)) {
    fs.writeFileSync(npmrc, `//registry.npmjs.org/:_authToken=\${NPM_TOKEN}\n`);
  }

  const routes = router.create({ getContext });
  const server = express().use(json()).use(urlPrefix, routes);

  return { server, downloadDir, urlPrefix, prerelease };
}
