import React from 'react';
import { DevActions } from 'sys.ui.dev';
import { MonacoEditor, MonacoEditorProps } from '.';
import { rx, t } from '../../common';

type Ctx = { props: MonacoEditorProps };

/**
 * Actions
 *
 * Refs:
 *    https://github.com/suren-atoyan/monaco-react
 *    https://microsoft.github.io/monaco-editor/api
 */
export const actions = DevActions<Ctx>()
  .namespace('ui.code/MonacoEditor')
  .context((prev) => {
    if (prev) return prev;

    const bus = rx.bus<t.CodeEditorEvent>();

    return { props: { bus } };
  })

  .items((e) => {
    //
  })

  .subject((e) => {
    e.settings({
      layout: {
        border: -0.1,
        cropmarks: -0.2,
        background: 1,
        label: '<MonacoEditor>',
        position: [150, 80],
      },
      host: { background: -0.04 },
    });
    e.render(<MonacoEditor {...e.ctx.props} />);
  });

export default actions;
