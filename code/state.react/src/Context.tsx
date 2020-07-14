/* eslint-disable react/display-name */

import * as React from 'react';
import * as t from './types';

/**
 * The React [Context] used to pass down common modules to components.
 *
 * To use add a static `contextType` to the consuming component,
 * eg:
 *
 *      import { state } from '@platform/state.react'
 *
 *      export class MyView extends React.PureComponent {
 *        public static contextType = state.Context;
 *        public context!: state.ReactContext
 *        public store = this.context.getStore<IMyModel, MyEvent>();
 *      }
 *
 * See:
 *    https://reactjs.org/docs/context.html
 */
export const Context = React.createContext<t.IStateContext>({} as any);
Context.displayName = '@platform/state/Context';

/**
 * Used to strongly type the [context] on a React component.
 * eg:
 *
 *      import { state } from '@platform/state.react'
 *
 *      export class MyView extends React.PureComponent {
 *        public static contextType = state.Context;
 *        public context!: state.ReactContext
 *        public store = this.context.getStore<IMyModel, MyEvent>();
 *      }
 *
 */
export type ReactContext = React.ContextType<typeof Context>;

/**
 * Factory for creating a <Provider> component to pass a
 * store (and optionally additional props) through the react
 * hierarchy to child components.
 */
export function createProvider<P = Record<string, unknown>>(
  store: t.IStoreContext,
  ctx?: P,
): React.FunctionComponent {
  const context: t.IStateContext = {
    getStore: () => store as t.IStoreContext<any, any>,
    ...(ctx || {}), // Optional props to extend the context with.
  };
  return (props: { children?: React.ReactNode } = {}) => (
    <Context.Provider value={context}>{props.children}</Context.Provider>
  );
}
