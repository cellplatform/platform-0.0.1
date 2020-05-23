import { fs, t } from '../common';

type ExportQuery = string | t.IDbQuery;

/**
 * Exports the given keys from the DB to JSON files.
 */
export async function exportFiles(args: {
  db: t.IDb;
  dir: string;
  query: ExportQuery | ExportQuery[];
  parseKey?: (key: string) => string;
}) {
  // Setup initial conditions.
  const { db } = args;
  const dir = fs.resolve(args.dir);
  await fs.ensureDir(dir);

  let total = 0;
  const run = async (query: ExportQuery) => {
    // Retrieve items to export.
    const data = await db.find(query);

    // Export each item.
    await Promise.all(
      data.list.map(async ({ value, props }) => {
        const key = args.parseKey ? args.parseKey(props.key) : props.key;
        const file = fs.join(dir, `${key}.json`);
        const { createdAt, modifiedAt } = props;
        const json = {
          [key]: {
            data: value,
            createdAt,
            modifiedAt,
          },
        };
        await fs.ensureDir(fs.dirname(file));
        await fs.writeFile(file, JSON.stringify(json, null, '  '));
        total++;
      }),
    );
  };

  const queries = Array.isArray(args.query) ? args.query : [args.query];
  await Promise.all(queries.map((query) => run(query)));

  // Finish up.
  return { total };
}
