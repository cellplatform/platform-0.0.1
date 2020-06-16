/**
 * Generated types defined in namespace:
 * 
 *    |                
 *    |➔  ns:sys.app.type
 *    |
 *
 * By:
 *    @platform/cell.typesystem@0.0.69
 * 
 * Notes: 
 * 
 *    - DO NOT manually edit this file (it will be regenerated automatically).
 *    - DO check this file into source control.
 *    - Usage
 *        Import the [.d.ts] file within the consuming module
 *        that uses a [TypedSheet] to programatically manipulate 
 *        the namespace in a strongly-typed manner, for example:
 * 
 *            import * as t from './types.g.ts';
 * 
 */

import * as t from '@platform/cell.types';

export declare type App = {
  name: string;
  backgroundColor: string;
  fs: string;
  bytes: number;
  entry: string;
  devPort: number;
  windows: t.ITypedSheetRefs<AppWindow>;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
};

export declare type AppWindow = {
  app: string;
  title: string;
  width: number;
  height: number;
  x: number;
  y: number;
  isVisible: boolean;
};
