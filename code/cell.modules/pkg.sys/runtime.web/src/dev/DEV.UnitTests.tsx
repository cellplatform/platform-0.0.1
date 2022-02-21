import React from 'react';
import { DevActions, Test } from 'sys.ui.dev';
import { TestSuiteRunResponse, TestSuiteModel } from 'sys.ui.dev/lib/types';

type CtxRunTests = () => Promise<TestSuiteRunResponse>;

type Ctx = {
  results?: TestSuiteRunResponse;
  tests: { RuntimeBus: CtxRunTests };
};

/**
 * Actions
 */
export const actions = DevActions<Ctx>()
  .namespace('UnitTests')
  .context((e) => {
    if (e.prev) return e.prev;

    const run = async (bundle: TestSuiteModel) => {
      const results = await bundle.run();
      e.change.ctx((ctx) => (ctx.results = results));
      return results;
    };

    const tests: Ctx['tests'] = {
      async RuntimeBus() {
        return run(
          await Test.bundle([
            import('../web.RuntimeBus/BusEvents.TEST'),
            import('../web.RuntimeBus/BusController.TEST'),
          ]),
        );
      },
    };

    const ctx: Ctx = { tests };

    tests.RuntimeBus(); // Auto-run on load.

    return ctx;
  })

  .items((e) => {
    e.title('Run Tests');

    e.button('run: RuntimeBus', (e) => e.ctx.tests.RuntimeBus());

    e.hr();
  })

  .subject((e) => {
    e.settings({
      host: { background: -0.04 },
      layout: {
        label: '<Test.View.Results>',
        position: [150, 80],
        border: -0.1,
        cropmarks: -0.2,
        background: 1,
      },
    });

    e.render(
      <Test.View.Results data={e.ctx.results} style={{ flex: 1, padding: 20 }} scroll={true} />,
    );
  });

export default actions;
