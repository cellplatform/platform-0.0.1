import MonacoEditorCore, { OnMount, BeforeMount } from '@monaco-editor/react';
import React from 'react';

import { CodeEditor } from '../../api';
import { css, CssValue, DEFAULT, t } from '../../common';

type E = t.IMonacoStandaloneCodeEditor;
type S = t.ICodeEditorSingleton;

export type MonacoEditorReady = { instance: E; singleton: S };
export type MonacoEditorReadyHandler = (e: MonacoEditorReady) => void;

export type MonacoEditorProps = {
  bus: t.EventBus<any>;
  language?: t.CodeEditorLanguage;
  theme?: t.CodeEditorTheme;
  loading?: React.ReactNode;
  style?: CssValue;
  onReady?: MonacoEditorReadyHandler;
};

/**
 * Minimal wrapper around a vanilla [Monaco] editor.
 *
 * Refs:
 *    https://github.com/suren-atoyan/monaco-react
 *    https://microsoft.github.io/monaco-editor/api
 *
 */
export const MonacoEditor: React.FC<MonacoEditorProps> = (props) => {
  const { language = DEFAULT.LANGUAGE.TS, theme } = props;

  const beforeMount: BeforeMount = (monaco) => {
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
  };

  const afterMount: OnMount = async (editor, monaco) => {
    const singleton = await CodeEditor.singleton(props.bus);
    const instance = editor as any;
    props.onReady?.({ instance, singleton });
  };

  const styles = {
    base: css({ Absolute: 0 }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <MonacoEditorCore
        language={language}
        theme={theme}
        beforeMount={beforeMount}
        onMount={afterMount}
        loading={props.loading}
        options={{ minimap: { enabled: true } }}
      />
    </div>
  );
};

/**
 * Default export.
 */
export default MonacoEditor;
