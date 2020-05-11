import { t } from '../../common';

/**
 * 🏷REFS (how to):
 *
 *    Details for handling different libs for different editor windows:
 *    https://blog.expo.io/building-a-code-editor-with-monaco-f84b3a06deaf
 *
 *    Adding snippets:
 *    https://stackoverflow.com/questions/48212023/how-to-insert-snippet-in-monaco-editor
 */

/**
 * Configure language (typescript) settings of the IDE.
 */
export async function language(monaco: t.IMonaco) {
  const typescript = monaco.languages.typescript;
  const defaults = typescript.typescriptDefaults;

  /**
   * Compiler options:
   *    - https://www.typescriptlang.org/docs/handbook/compiler-options.html
   *    - https://microsoft.github.io/monaco-editor/api/interfaces/monaco.languages.typescript.languageservicedefaults.html#setcompileroptions
   */
  defaults.setCompilerOptions({
    noLib: true,
    allowNonTsExtensions: true,
    target: typescript.ScriptTarget.ES2015, // NB: ES6.
  });

  const addLib = (filename: string, content: string) => {
    defaults.addExtraLib(content, `ts:filename/${filename}`);
  };

  /**
   * Load standard ECMAScript language types.
   */
  // @ts-ignore
  const es = await import('./libs.d.yml');
  const libs: { [filename: string]: string } = es.libs;
  Object.keys(libs).forEach(filename => addLib(filename, libs[filename]));
}
