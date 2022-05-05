import React, { useEffect, useRef, useState } from 'react';

import { CodeEditorInstance } from '../../api';
import { Loading } from '../Loading';
import { MonacoEditor, MonacoEditorReady } from '../Monaco';
import { css, CssValue, DEFAULT, FC, LANGUAGES, rx, t } from './common';

/**
 * Types
 */
export type CodeEditorProps = {
  instance?: { bus: t.EventBus<any>; id?: string };
  theme?: t.CodeEditorTheme;
  language?: t.CodeEditorLanguage;
  focusOnLoad?: boolean;
  filename?: string;
  style?: CssValue;
  onReady?: t.CodeEditorReadyEventHandler;
};

/**
 * Component
 */
const View: React.FC<CodeEditorProps> = (props) => {
  const language = props.language ?? DEFAULT.LANGUAGE.TS;
  const bus = rx.bus<t.CodeEditorEvent>(props.instance?.bus);
  const editorRef = useRef<t.CodeEditorInstance>();

  const [ready, setReady] = useState<boolean>(false);
  const [theme, setTheme] = useState<t.CodeEditorTheme>();

  /**
   * Handlers
   */
  const handleReady = async (e: MonacoEditorReady) => {
    const { filename } = props;
    const { singleton, instance } = e;
    const id = props.instance?.id;

    const editor = CodeEditorInstance({
      instance: { bus, id },
      monaco: { singleton, instance },
      filename,
      language,
    });
    editorRef.current = editor;

    props.onReady?.({ id: editor.id, editor });
    if (props.focusOnLoad) editor.focus();

    // HACK: Theme not being applied until load has completed.
    setTheme(DEFAULT.THEME);
    setReady(true);
  };

  /**
   * Lifecycle
   */
  useEffect(() => {
    () => editorRef.current?.dispose(); // Clean up.
  }, []);

  useEffect(() => {
    setTheme(props.theme);
  }, [props.theme]);

  useEffect(() => {
    editorRef.current?.events.model.set.language(language);
  }, [language]); // eslint-disable-line

  /**
   * Render
   */

  const styles = {
    base: css({ Absolute: 0 }),
    editor: css({ display: ready ? 'block' : 'none' }),
  };

  const elLoading = !ready && <Loading theme={props.theme || DEFAULT.THEME} />;

  return (
    <div {...css(styles.base, props.style)}>
      {elLoading}
      <MonacoEditor bus={bus} theme={theme} style={styles.editor} onReady={handleReady} />
    </div>
  );
};

/**
 * Export
 */

type Fields = {
  languages: t.CodeEditorLanguage[];
};
export const CodeEditor = FC.decorate<CodeEditorProps, Fields>(
  View,
  { languages: LANGUAGES },
  { displayName: 'CodeEditor' },
);
