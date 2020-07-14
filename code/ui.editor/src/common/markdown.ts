import * as t from '../types';
import { defaultMarkdownParser, defaultMarkdownSerializer } from 'prosemirror-markdown';
import { Schema } from 'prosemirror-model';

export const schema = require('prosemirror-markdown').schema as Schema; // eslint-disable-line

export function serialize(state: t.EditorState) {
  return defaultMarkdownSerializer.serialize(state.doc);
}

export function parse(text: string): t.Node {
  return defaultMarkdownParser.parse(text);
}
