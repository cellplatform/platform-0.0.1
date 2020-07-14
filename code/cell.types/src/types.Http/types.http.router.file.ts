import { t } from '../common';

export type IUrlParamsFile = { ns: string; file: string };

/**
 * GET: File
 */
export type IReqQueryFileInfo = Record<string, unknown>; // 🐷 Placeholder type.
export type IReqQueryFileDownload = { hash?: string };

export type IResGetFile = t.IUriResponse<IResGetFileData, IResGetFileUrls>;
export type IResGetFileData = t.IFileData;
export type IResGetFileUrls = { info: string; download: string };

/**
 * POST: File (upload "start")
 */
export type IResPostFileUploadStart = IResGetFile & {
  upload: t.IFilePresignedUploadUrl;
  changes?: t.IDbModelChange[];
};

/**
 * POST: File (upload "complete")
 */
export type IReqQueryFileUploadComplete = {
  changes?: boolean; // NB: return list of changes (default: true).
};

export type IReqPostFileUploadCompleteBody = Record<string, unknown>; // 🐷 Placeholder type.
export type IResPostFileUploadComplete = IResGetFile & {
  changes?: t.IDbModelChange[];
};

/**
 * LOCAL (local device stand-in for external/cloud systems)
 * NOTE:
 *    Used on locally running instances to recieve bindary file data to save.
 *    When working against S3, this is the cloud end-point (using a presigned-url).
 */
export type IResPostFileUploadLocal = { path: string };
export type IReqQueryLocalFs = Record<string, unknown>; // 🐷 Placeholder type.

/**
 * DELETE: File
 */
export type IReqQueryFileDelete = {
  changes?: boolean; // NB: return list of changes (default: true).
};

export type IResDeleteFile = { uri: string; deleted: boolean };
