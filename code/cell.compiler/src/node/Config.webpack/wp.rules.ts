import { t } from '../common';

type IArgs = { model: t.CompilerModel; isProd: boolean; isDev: boolean };

export const Rules = {
  /**
   * Initialize rules.
   */
  init(args: IArgs) {
    return [Rules.css(args), Rules.typescript(args), Rules.svg(args)];
  },

  /**
   * CSS (Stylesheets)
   */
  css(args: IArgs) {
    return {
      test: /\.css$/i,
      use: ['style-loader', 'css-loader'],
    };
  },

  /**
   * Typescript (language).
   */
  typescript(args: IArgs) {
    /**
     * 🌳 https://babeljs.io/docs/en/babel-preset-react
     */
    const presetReact = '@babel/preset-react';

    /**
     * 🌳 https://babeljs.io/docs/en/babel-preset-typescript
     */
    const presetTypescript = [
      '@babel/preset-typescript',
      {
        /**
         * NB: This is required for proper typescript file watching.
         *     See:
         *       - https://github.com/TypeStrong/fork-ts-checker-webpack-plugin#type-only-modules-watching
         *       - https://github.com/TypeStrong/fork-ts-checker-webpack-plugin/blob/master/examples/babel-loader/.babelrc.js
         *       - https://babeljs.io/docs/en/babel-preset-typescript#onlyremovetypeimports
         */
        onlyRemoveTypeImports: true,
      },
    ];

    /**
     * 🌳 https://babeljs.io/docs/en/babel-preset-env
     */
    const presetEnv = [
      '@babel/preset-env',
      {
        useBuiltIns: 'usage', // https://babeljs.io/docs/en/babel-preset-env#usebuiltins
        corejs: 3, // https://babeljs.io/docs/en/babel-preset-env#corejs
      },
    ];

    return {
      test: /\.(ts|tsx|js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [presetTypescript, presetReact, presetEnv],
          plugins: [
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-transform-modules-commonjs',
          ],
        },
      },
    };
  },

  /**
   * <SVG> image support.
   *       https://react-svgr.com
   */
  svg(args: IArgs) {
    return {
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            dimensions: false, // NB: Removes width/height from SVG itself so it can be set via React property.

            // SVGO options
            //    https://github.com/svg/svgo
            //    https://gist.github.com/pladaria/69321af86ce165c2c1fc1c718b098dd0
            svgoConfig: {
              plugins: [{ cleanupIDs: false }],
            },
          },
        },
      ],
    };
  },
};
