/**
 * Generated types defined in namespace:
 * 
 *    |                
 *    |➔  ns:foo
 *    |
 *
 * By:
 *    @platform/cell.typesystem@0.0.122
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

/**
 * Complete index of types available within the sheet.
 * Use by passing into a sheet at creation, for example:
 *
 *    const sheet = await TypedSheet.load<t.TypeIndex>({ ns, fetch });
 *
 */
export declare type TypeIndex = {
  MyRow: MyRow;
  MyColor: MyColor;
  MyOther: MyOther;
};

export declare type MyRow = {
  title: string;
  isEnabled: boolean;
  color: MyColor;
};

export declare type MyColor = {
  label: string;
  color: 'red' | 'green' | 'blue';
};

export declare type MyOther = {
  label: string;
};
