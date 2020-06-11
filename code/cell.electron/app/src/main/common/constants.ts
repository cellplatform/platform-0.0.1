export * from '../../common/constants';
export * from './constants.paths';

/**
 * Environment.
 */
export const ENV = {
  get node() {
    return process.env.NODE_ENV;
  },
  get isDev() {
    return ENV.node === 'development';
  },
  get isProd() {
    return ENV.node === 'production';
  },
};
