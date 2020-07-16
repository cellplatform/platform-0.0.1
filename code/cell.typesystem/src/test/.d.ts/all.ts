/**
 * Generated types defined in namespace:
 * 
 *    |                
 *    |➔  ns:foo
 *    |➔  ns:foo.primitives
 *    |➔  ns:foo.messages
 *    |➔  ns:foo.enum
 *    |➔  ns:foo.defaults
 *    |➔  ns:foo.multi
 *    |
 *
 * By:
 *    @platform/cell.typesystem@0.0.83
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
 *            import * as t from './<filename>;
 * 
 */

import * as t from '@platform/cell.types';

/**
 * Complete index of types available within the sheet.
 * Use by passing into a sheet at creation, for example:
 *
 *    const sheet = await TypedSheet.load<t.TypeIndex>({ ns, fetch });
 *
 */
export declare type TypeIndex = {
  MyRow: MyRow;
  MyMessage: MyMessage;
  MyColor: MyColor;
  Primitives: Primitives;
  MyMessages: MyMessages;
  Enum: Enum;
  MyDefault: MyDefault;
  MyOne: MyOne;
  MyTwo: MyTwo;
};

export declare type MyRow = {
  title: string;
  isEnabled: boolean | null;
  color?: MyColor;
  message: t.ITypedSheetRef<TypeIndex, 'MyMessage'> | null;
  messages: t.ITypedSheetRefs<TypeIndex, 'MyMessage'>;
};

export declare type MyMessage = {
  date: number;
  user: string;
  message: string;
};

export declare type MyColor = {
  label: string;
  color: 'red' | 'green' | 'blue';
  description?: string;
};

export declare type Primitives = {
  stringValue: string;
  numberValue: number;
  booleanValue: boolean;
  nullValue: null | string | number;
  undefinedValue?: string;
  stringProp: string;
  numberProp: number;
  booleanProp: boolean;
  nullProp: null | number;
  undefinedProp?: string;
};

export declare type MyMessages = {
  channel: string;
  color?: t.ITypedSheetRef<TypeIndex, 'MyColor'>;
  messages: t.ITypedSheetRefs<TypeIndex, 'MyMessage'>;
};

export declare type Enum = {
  single?: 'hello';
  union: 'red' | 'green' | 'blue'[];
  array: ('red' | 'green' | 'blue')[];
};

export declare type MyDefault = {
  title: string;
  foo: string;
};

export declare type MyOne = {
  title: string;
  foo: string;
};

export declare type MyTwo = {
  bar: string;
  name: string;
};
