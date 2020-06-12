/* eslint-disable */

import { local } from '@platform/cell.fs.local';
import { s3 } from '@platform/cell.fs.s3';
import { NeDb } from '@platform/fsdb.nedb';

import { server, util } from './common';
import { SECRETS } from './constants';

const TMP = util.resolve('tmp');

/**
 * Database.
 */
const filename = `${TMP}/sample.db`;
const db = NeDb.create({ filename });

/**
 * File system.
 */
const getLocalFs = () => local.init({ root: `${TMP}/fs`, fs: util.fs });

const getRemoteFs = () =>
  s3.init({
    root: 'platform/tmp/test.http',
    endpoint: 'sfo2.digitaloceanspaces.com',
    accessKey: SECRETS.S3.KEY,
    secret: SECRETS.S3.SECRET,
  });

/**
 * Initialize and start the HTTP application server.
 */
const app = server.create({
  name: 'sample',
  db,
  // fs: getRemoteFs(), // TEMP 🐷 - revert to local FS.
  fs: getLocalFs(),
  // log: ['ROUTES'],
});

app.start({ port: 8080 });
server.logger.start({ app });
