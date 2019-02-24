import { constants, create, Db, express, fs, Swarm } from './common';

export const router = express.Router();

type Ref = { db: Db; swarm: Swarm; name: string; dir: string };
type Refs = { [key: string]: Ref };
const refs: Refs = {};

/**
 * Create a new DB instance.
 */
async function createDb(args: { dbKey: string }) {
  const { dbKey } = args;
  const name = `${dbKey}.db`;
  const dir = fs.join(constants.TMP, name);
  const { db, swarm } = await create({ dir, dbKey });
  return { dir, name, db, swarm };
}

/**
 * Retrieve the requested DB.
 */
async function getOrCreateDb(args: { dbKey: string }) {
  const { dbKey } = args;
  return refs[dbKey] ? refs[dbKey] : (refs[dbKey] = await createDb(args));
}

/**
 * Gets details for a specific database.
 */
router.get('/:dbKey', async (req, res) => {
  const dbKey = req.params.dbKey as string;
  const { db } = await getOrCreateDb({ dbKey });
  const version = await db.version();
  res.send({ dbKey, version });
});

/**
 * Gets the value at the given key.
 */
router.get('/:dbKey/:key', async (req, res) => {
  const dbKey = req.params.dbKey as string;
  const key = req.params.key as string;
  const { db } = await getOrCreateDb({ dbKey });
  const data = await db.get(key);
  const { value, meta } = data;
  const { exists, deleted } = meta;
  res.send({ db: dbKey, key, value, exists, deleted });
});

/**
 * Status info on all databases.
 */
router.get('*', async (req, res) => {
  const items = Object.keys(refs).map(key => refs[key]);
  const dbs = items.map(ref => ref.name);
  const tmp = constants.TMP;
  res.send({
    hello: '👋',
    dir: tmp,
    dbs,
  });
});
