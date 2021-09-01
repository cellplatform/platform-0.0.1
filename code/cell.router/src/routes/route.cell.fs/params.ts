import { ERROR, Schema, t } from '../common';

export type ParamOr =
  | t.IUrlParamsCellFs
  | t.IUrlParamsCellFileByName
  | t.IUrlParamsCellFileByFileUri;

export type ParamAnd = t.IUrlParamsCellFs &
  t.IUrlParamsCellFileByName &
  t.IUrlParamsCellFileByFileUri;

export const getParams = (args: { params: ParamOr }) => {
  const params = args.params as ParamAnd;
  const toString = (input?: any) => (input || '').toString().trim();
  const toMessage = (msg: string) => `Malformed URI, ${msg}`;

  const data = {
    ns: toString(params.ns || ''),
    key: toString(params.key || ''),
    cellUri: '',
  };

  const error: t.IError = {
    type: ERROR.HTTP.MALFORMED_URI,
    message: '',
  };

  if (!data.ns) {
    error.message = toMessage('does not contain a namespace-identifier');
    return { ...data, status: 400, error };
  }

  if (!data.key) {
    error.message = toMessage('does not contain a cell key (eg A1)');
    return { ...data, status: 400, error };
  }

  try {
    data.cellUri = Schema.Uri.create.cell(data.ns, data.key);
  } catch (err: any) {
    error.message = toMessage(err.message);
    return { ...data, status: 400, error };
  }

  return { ...data, status: 200, error: undefined };
};
