/**
 * Taken from notes in loader README:
 *
 *    https://github.com/webpack-contrib/worker-loader#integrating-with-typescript
 *
 */
declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}
