import { t } from '../common';
import * as HtmlWebPackPlugin from 'html-webpack-plugin';

type M = t.WebpackModel | t.ConfigBuilderChain;

/**
 * Converts a configuration state into a live webpack object.
 */
export function toWebpackConfig(input: M): t.WebpackConfig {
  const model = toModel(input);
  const { mode, port } = model;
  const prod = mode === 'production';
  const publicPath = `http://localhost:${port}/`;

  const html = new HtmlWebPackPlugin({ title: 'Untitled' });

  /**
   * TODO 🐷
   *  - Linter
   *  - Entry
   *  - Title
   */

  const config: t.WebpackConfig = {
    mode,
    output: { publicPath },

    // TEMP 🐷
    entry: { main: './src/test/test.entry.ts' },

    resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'] },
    devtool: prod ? undefined : 'eval-cheap-module-source-map',
    devServer: prod ? undefined : { port, hot: true },

    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-typescript', '@babel/preset-react', '@babel/preset-env'],
              plugins: ['@babel/plugin-proposal-class-properties'],
            },
          },
        },
      ],
    },

    plugins: [html],
  };

  return config;
}

/**
 * Wrangle objects types into a [model].
 */
export const toModel = (input: M) => {
  return (typeof (input as any).toObject === 'function'
    ? (input as any).toObject()
    : input) as t.WebpackModel;
};
