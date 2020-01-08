import { Json } from '@platform/types';
import { IHttpHeaders } from '@platform/http/lib/types';

export type S3Config = {
  accessKey: string;
  secret: string;
  endpoint: string;
};

export type S3Permissions = 'private' | 'public-read' | 'public-read-write';
export type S3StorageClass =
  | 'STANDARD'
  | 'REDUCED_REDUNDANCY'
  | 'GLACIER'
  | 'STANDARD_IA'
  | 'ONEZONE_IA'
  | 'INTELLIGENT_TIERING'
  | 'DEEP_ARCHIVE';

export type S3 = {
  toContentType(key: string): string | undefined;
  endpoint: string;
  url(bucket: string, path?: string): string;
  list(args: { bucket: string; prefix?: string; max?: number }): S3List;
  get(args: { bucket: string; key: string }): Promise<S3GetResponse>;
  put(args: {
    bucket: string;
    key: string;
    source: string | Buffer;
    acl?: S3Permissions;
    contentType?: string;
    contentDisposition?: string;
  }): Promise<S3PutResponse>;
  deleteOne(args: { bucket: string; key: string }): Promise<S3DeleteOneResponse>;
  deleteMany(args: { bucket: string; keys: string[] }): Promise<S3DeleteManyResponse>;
  bucket(name: string): S3Bucket;
};

export type S3Bucket = {
  endpoint: string;
  url(path?: string, options?: S3PresignedUrlArgs): string;
  list(args: { prefix?: string; max?: number }): S3List;
  get(args: { key: string }): Promise<S3GetResponse>;
  put(args: {
    key: string;
    source: string | Buffer;
    acl?: S3Permissions;
    contentType?: string;
    contentDisposition?: string;
  }): Promise<S3PutResponse>;
  deleteOne(args: { key: string }): Promise<S3DeleteOneResponse>;
  deleteMany(args: { keys: string[] }): Promise<S3DeleteManyResponse>;
};

export type S3PresignedUrlArgs = S3PresignedUrlGetObjectArgs | S3PresignedUrlPutObjectArgs;
export type S3PresignedUrlGetObjectArgs = {
  operation: 'getObject';
  seconds?: number;
};
export type S3PresignedUrlPutObjectArgs = {
  operation: 'putObject';
  seconds?: number;
  body?: Buffer;
  md5?: string;
};

export type S3List = {
  objects: Promise<S3ListObjectsResponse>;
  dirs: Promise<S3ListDirsResponse>;
};

/**
 * Get
 */
export type S3GetResponse = {
  ok: boolean;
  status: number;
  key: string;
  modifiedAt: number;
  etag?: string;
  error?: Error;
  content: { type: string; length: number };
  data?: Buffer;
  json: Json;
  save(path: string): Promise<{}>;
};

/**
 *
 * Put
 */
export type S3PutResponse = {
  ok: boolean;
  status: number;
  key: string;
  bucket: string;
  url?: string;
  etag?: string;
  error?: Error;
};

/**
 * Post (form data)
 */
export type S3Post = {
  url: string;
  fields: { [key: string]: string };
  send: (source: string | Buffer, options?: { headers?: IHttpHeaders }) => Promise<S3PostResponse>;
};
export type S3PostResponse = {
  ok: boolean;
  status: number;
  key: string;
  bucket: string;
  url: string;
  etag?: string;
  error?: Error;
};

/**
 * Delete
 */
export type S3DeleteOneResponse = {
  ok: boolean;
  status: number;
  key: string;
  bucket: string;
  error?: Error;
};
export type S3DeleteManyResponse = {
  ok: boolean;
  status: number;
  keys: string[];
  bucket: string;
  error?: Error;
};

/**
 * List
 */
export type S3ListResponse = {
  ok: boolean;
  status: number;
  prefix: string;
  max: number;
  error?: Error;
};

export type S3ListObjectsResponse = S3ListResponse & { items: S3ListObject[] };
export type S3ListObject = {
  key: string;
  modifiedAt: number;
  etag: string;
  storage: S3StorageClass;
  owner: { id: string; displayName: string };
};

export type S3ListDirsResponse = S3ListResponse & { items: S3ListDir[] };
export type S3ListDir = { key: string };
