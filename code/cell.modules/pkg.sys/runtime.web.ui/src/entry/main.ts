import Worker from 'worker-loader?inline=no-fallback!../workers/web.worker';
import { ServiceWorker } from '@platform/cell.runtime.web/lib/ServiceWorker';

/**
 * Web-worker.
 */
const worker = new Worker();
worker.onmessage = (e: MessageEvent) =>
  console.log('sys.runtime(🌼): event (from worker thread)', e.data);

setTimeout(() => worker.postMessage({ msg: 'Hello from sys.runtime(🌼) [workers.init.ts]' }), 500);

/**
 * DOM (User Interface)
 */
export async function startDom() {
  const init = import('./main.dom');
  init.catch((err) => console.log('INIT sys.runtime.web.ui // 🐷 ERROR:', err));
}

/**
 * Startup
 */
(async () => {
  await ServiceWorker.start('./service.worker.js', { localhost: false });
  await startDom();
})();
