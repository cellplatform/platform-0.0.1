import { t } from '../common';

/**
 * Type Payload
 * (NB: can write directly to HTTP client )
 */
export type ITypeDefPayload = { ns?: t.INsProps; columns: t.IColumnMap };

/**
 * Type Definitions
 */
export type INsTypeDef = {
  ok: boolean;
  uri: string;
  typename: string;
  columns: t.IColumnTypeDef[];
  errors: t.ITypeError[];
};

export type IColumnTypeDef<T extends IType = IType> = ITypeDef<T> & {
  column: string;
  error?: t.ITypeError;
};

export type ITypeDef<T extends IType = IType> = {
  prop: string;
  type: T;
  optional?: boolean;
  default?: PrimitiveValue | ITypeDefault;
  target?: t.CellTypeTarget;
};

/**
 * Default Values
 */
export type ITypeDefault = ITypeDefaultValue | ITypeDefaultRef;
export type ITypeDefaultValue = { value: TypeDefaultValue };
export type ITypeDefaultRef = { ref: string; path?: string };
export type TypeDefaultValue = PrimitiveValue | PrimitiveValue[] | t.JsonMap;

/**
 * Types
 */
export type PrimitiveValue = string | number | boolean | undefined | null;

export type ITypePrimitives = {
  string: t.ITypeValue;
  number: t.ITypeValue;
  boolean: t.ITypeValue;
  undefined: t.ITypeValue;
  null: t.ITypeValue;
};

export type IType = ITypeValue | ITypeEnum | ITypeUnion | ITypeRef | ITypeUnknown;

export type ITypeUnion = {
  kind: 'UNION';
  typename: string;
  isArray?: boolean;
  types: IType[];
};

export type ITypeRef = {
  kind: 'REF';
  scope: 'NS' | 'COLUMN' | 'UNKNOWN';
  uri: string;
  typename: string;
  isArray?: boolean;
  types: ITypeDef[];
};

export type ITypeValue = {
  kind: 'VALUE';
  typename: keyof ITypePrimitives;
  isArray?: boolean;
};

export type ITypeEnum = {
  kind: 'ENUM';
  typename: string;
  isArray?: boolean;
};

export type ITypeUnknown = {
  kind: 'UNKNOWN';
  typename: string;
  isArray?: boolean;
};
