import { t, DEFAULT } from '../../common';

/**
 * 🏷 REFS (how to):
 *
 *    Details for handling different libs for different editor windows:
 *    https://blog.expo.io/building-a-code-editor-with-monaco-f84b3a06deaf
 *
 *    Adding snippets:
 *    https://stackoverflow.com/questions/48212023/how-to-insert-snippet-in-monaco-editor
 */

/**
 * Configure the "prettier" code formatter.
 */
export async function registerPrettier(api: t.ICodeEditorSingleton) {
  api.monaco.languages.registerDocumentFormattingEditProvider(DEFAULT.LANGUAGE.TS, {
    async provideDocumentFormattingEdits(model, options, token) {
      try {
        const prettier = await import('prettier/standalone');
        const typescript = await import('prettier/parser-typescript');
        const text = prettier.format(model.getValue(), {
          parser: 'typescript',
          plugins: [typescript],
          singleQuote: true,
        });
        return [
          {
            range: model.getFullModelRange(),
            text,
          },
        ];
      } catch (error: any) {
        throw error;
      }
    },
  });
}
