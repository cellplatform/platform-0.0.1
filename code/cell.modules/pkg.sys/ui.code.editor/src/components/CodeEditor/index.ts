import { t } from '../../common';
import * as React from 'react';
import { InstanceEvents } from '../../api';
import { CodeEditor as Component, CodeEditorProps } from './CodeEditor';

/**
 * Decorate component with helper functions.
 */
type FC = React.FC<CodeEditorProps> & { events: t.CodeEditorInstanceEventsFactory };
export const CodeEditor = Component as FC;
CodeEditor.events = InstanceEvents.create;
