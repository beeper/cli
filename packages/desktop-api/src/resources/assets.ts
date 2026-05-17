// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import { APIPromise } from '../core/api-promise';
import { type Uploadable } from '../core/uploads';
import { buildHeaders } from '../internal/headers';
import { RequestOptions } from '../internal/request-options';
import { multipartFormRequestOptions } from '../internal/uploads';

/**
 * Manage files for message attachments
 */
export class BaseAssets extends APIResource {
  static override readonly _key: readonly ['assets'] = Object.freeze(['assets'] as const);

  /**
   * Download a file from an mxc:// or localmxc:// URL to the device running the
   * Beeper Client API and return the local file URL.
   *
   * @example
   * ```ts
   * const response = await client.assets.download({
   *   url: 'mxc://example.org/Q4x9CqGz1pB3Oa6XgJ',
   * });
   * ```
   */
  download(body: AssetDownloadParams, options?: RequestOptions): APIPromise<AssetDownloadResponse> {
    return this._client.post('/v1/assets/download', { body, ...options });
  }

  /**
   * Stream a file given an mxc://, localmxc://, or file:// URL. Downloads first if
   * not cached. Supports Range requests for seeking in large files.
   *
   * @example
   * ```ts
   * const response = await client.assets.serve({ url: 'x' });
   *
   * const content = await response.blob();
   * console.log(content);
   * ```
   */
  serve(query: AssetServeParams, options?: RequestOptions): APIPromise<Response> {
    return this._client.get('/v1/assets/serve', {
      query,
      ...options,
      headers: buildHeaders([{ Accept: 'application/octet-stream' }, options?.headers]),
      __binaryResponse: true,
    });
  }

  /**
   * Upload a file to a temporary location using multipart/form-data. Returns an
   * uploadID that can be referenced when sending a message or creating a draft
   * attachment.
   *
   * @example
   * ```ts
   * const response = await client.assets.upload({
   *   file: fs.createReadStream('path/to/file'),
   * });
   * ```
   */
  upload(body: AssetUploadParams, options?: RequestOptions): APIPromise<AssetUploadResponse> {
    return this._client.post(
      '/v1/assets/upload',
      multipartFormRequestOptions({ body, ...options }, this._client),
    );
  }

  /**
   * Upload a file using a JSON body with base64-encoded content. Returns an uploadID
   * that can be referenced when sending a message or creating a draft attachment.
   * Alternative to the multipart upload endpoint.
   *
   * @example
   * ```ts
   * const response = await client.assets.uploadBase64({
   *   content: 'x',
   * });
   * ```
   */
  uploadBase64(
    body: AssetUploadBase64Params,
    options?: RequestOptions,
  ): APIPromise<AssetUploadBase64Response> {
    return this._client.post('/v1/assets/upload/base64', { body, ...options });
  }
}
/**
 * Manage files for message attachments
 */
export class Assets extends BaseAssets {}

export interface AssetDownloadResponse {
  /**
   * Error message if the download failed.
   */
  error?: string;

  /**
   * Local file URL to the downloaded file.
   */
  srcURL?: string;
}

export interface AssetUploadResponse {
  /**
   * Duration in seconds (audio/videos)
   */
  duration?: number;

  /**
   * Error message if upload failed
   */
  error?: string;

  /**
   * Resolved filename
   */
  fileName?: string;

  /**
   * File size in bytes
   */
  fileSize?: number;

  /**
   * Height in pixels (images/videos)
   */
  height?: number;

  /**
   * Detected or provided MIME type
   */
  mimeType?: string;

  /**
   * Local file URL (file://) for the uploaded file
   */
  srcURL?: string;

  /**
   * Unique upload ID for this temporary file
   */
  uploadID?: string;

  /**
   * Width in pixels (images/videos)
   */
  width?: number;
}

export interface AssetUploadBase64Response {
  /**
   * Duration in seconds (audio/videos)
   */
  duration?: number;

  /**
   * Error message if upload failed
   */
  error?: string;

  /**
   * Resolved filename
   */
  fileName?: string;

  /**
   * File size in bytes
   */
  fileSize?: number;

  /**
   * Height in pixels (images/videos)
   */
  height?: number;

  /**
   * Detected or provided MIME type
   */
  mimeType?: string;

  /**
   * Local file URL (file://) for the uploaded file
   */
  srcURL?: string;

  /**
   * Unique upload ID for this temporary file
   */
  uploadID?: string;

  /**
   * Width in pixels (images/videos)
   */
  width?: number;
}

export interface AssetDownloadParams {
  /**
   * Beeper media URL (mxc:// or localmxc://) for the file to download.
   */
  url: string;
}

export interface AssetServeParams {
  /**
   * File URL to serve. Accepts mxc://, localmxc://, or file:// URLs.
   */
  url: string;
}

export interface AssetUploadParams {
  /**
   * The file to upload (max 500 MB).
   */
  file: Uploadable;

  /**
   * Original filename. Defaults to the uploaded file name if omitted
   */
  fileName?: string;

  /**
   * MIME type. Auto-detected from magic bytes if omitted
   */
  mimeType?: string;
}

export interface AssetUploadBase64Params {
  /**
   * Base64-encoded file content (max ~500MB decoded)
   */
  content: string;

  /**
   * Original filename. Generated if omitted
   */
  fileName?: string;

  /**
   * MIME type. Auto-detected from magic bytes if omitted
   */
  mimeType?: string;
}

export declare namespace Assets {
  export {
    type AssetDownloadResponse as AssetDownloadResponse,
    type AssetUploadResponse as AssetUploadResponse,
    type AssetUploadBase64Response as AssetUploadBase64Response,
    type AssetDownloadParams as AssetDownloadParams,
    type AssetServeParams as AssetServeParams,
    type AssetUploadParams as AssetUploadParams,
    type AssetUploadBase64Params as AssetUploadBase64Params,
  };
}
