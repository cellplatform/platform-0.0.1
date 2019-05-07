import { ApolloServer, express, is, log } from './common';
import { init } from './schema';

const pkg = require('../../../package.json');
const schema = init({});

/**
 * [Express] web server.
 */
export const app = express();

/**
 * [GraphQL] server.
 */
export const server = new ApolloServer({ schema });
server.applyMiddleware({ app });

const port = 5000;
app.listen({ port }, () => {
  const url = log.cyan(`http://localhost:${log.magenta(port)}${log.gray('/graphql')}`);
  log.info.gray(`\n👋  Running on ${url}`);
  log.info();
  log.info.gray(`   - package:   ${pkg.name}`);
  log.info.gray(`   - version:   ${pkg.version}`);
  log.info.gray(`   - prod:      ${is.prod}`);
  log.info();
});
