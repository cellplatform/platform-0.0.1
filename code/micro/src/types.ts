import * as t from './common/types';

/**
 * Server
 */
export type ILogProps = { [key: string]: string | number | boolean };

export type ServerStart = (options?: {
  port?: number;
  log?: ILogProps;
  silent?: boolean;
}) => Promise<IMicroService>;

export type IMicro = {
  server: t.Server;
  router: t.IRouter;
  handler: t.RouteHandler;
  service?: IMicroService;
  events$: t.Observable<MicroEvent>;
  request$: t.Observable<IMicroRequest>;
  response$: t.Observable<IMicroResponse>;
  start: ServerStart;
  stop(): Promise<void>;
};

export type IMicroService = {
  port: number;
  isRunning: boolean;
  events$: t.Observable<MicroEvent>;
  request$: t.Observable<IMicroRequest>;
  response$: t.Observable<IMicroResponse>;
  stop(): Promise<void>;
};

/**
 * [Events]
 */

export type MicroEvent =
  | IMicroStartedEvent
  | IMicroStoppedEvent
  | IMicroRequestEvent
  | IMicroResponseEvent;

export type IMicroStartedEvent = {
  type: 'HTTP/started';
  payload: IMicroStarted;
};
export type IMicroStarted = { elapsed: t.IDuration; port: number };

export type IMicroStoppedEvent = {
  type: 'HTTP/stopped';
  payload: IMicroStopped;
};
export type IMicroStopped = { elapsed: t.IDuration; port: number; error?: string };

export type IMicroRequestEvent = {
  type: 'HTTP/request';
  payload: IMicroRequest;
};
export type IMicroRequest = {
  method: t.HttpMethod;
  url: string;
  req: t.IncomingMessage;
  error?: string;
  isModified: boolean;
  modify(input: IMicroRequestModify | (() => Promise<IMicroRequestModify>)): void;
};
export type IMicroRequestModify<C extends Record<string, unknown> = any> = { context?: C };

export type IMicroResponseEvent = {
  type: 'HTTP/response';
  payload: IMicroResponse;
};
export type IMicroResponse<C extends Record<string, unknown> = any> = {
  elapsed: t.IDuration;
  method: t.HttpMethod;
  url: string;
  req: t.IncomingMessage;
  res: t.IRouteResponse;
  error?: string;
  isModified: boolean;
  context: C;
  modify(input: t.IRouteResponse | (() => Promise<t.IRouteResponse>)): void;
};
