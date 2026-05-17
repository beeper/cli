// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import { APIPromise } from '../core/api-promise';
import { RequestOptions } from '../internal/request-options';

/**
 * Server discovery and capability metadata. Use /v1/info before authentication setup.
 */
export class BaseInfo extends APIResource {
  static override readonly _key: readonly ['info'] = Object.freeze(['info'] as const);

  /**
   * Returns app, platform, server, endpoint discovery, OAuth, and WebSocket metadata
   * for this Beeper Client API server.
   */
  retrieve(options?: RequestOptions): APIPromise<InfoRetrieveResponse> {
    return this._client.get('/v1/info', { ...options, __security: {} });
  }
}
/**
 * Server discovery and capability metadata. Use /v1/info before authentication setup.
 */
export class Info extends BaseInfo {}

export interface InfoRetrieveResponse {
  app: InfoRetrieveResponse.App;

  endpoints: InfoRetrieveResponse.Endpoints;

  platform: InfoRetrieveResponse.Platform;

  server: InfoRetrieveResponse.Server;
}

export namespace InfoRetrieveResponse {
  export interface App {
    /**
     * App bundle identifier
     */
    bundle_id: string;

    /**
     * App name
     */
    name: string;

    /**
     * App version
     */
    version: string;
  }

  export interface Endpoints {
    /**
     * MCP endpoint
     */
    mcp: string;

    oauth: Endpoints.OAuth;

    /**
     * OpenAPI spec endpoint
     */
    spec: string;

    /**
     * WebSocket events endpoint
     */
    ws_events: string;
  }

  export namespace Endpoints {
    export interface OAuth {
      /**
       * OAuth authorization endpoint
       */
      authorization_endpoint: string;

      /**
       * OAuth introspection endpoint
       */
      introspection_endpoint: string;

      /**
       * OAuth dynamic client registration endpoint
       */
      registration_endpoint: string;

      /**
       * OAuth token revocation endpoint
       */
      revocation_endpoint: string;

      /**
       * OAuth token endpoint
       */
      token_endpoint: string;

      /**
       * OAuth userinfo endpoint
       */
      userinfo_endpoint: string;
    }
  }

  export interface Platform {
    /**
     * CPU architecture
     */
    arch: string;

    /**
     * Operating system identifier
     */
    os: string;

    /**
     * Runtime release version
     */
    release?: string;
  }

  export interface Server {
    /**
     * Base URL of the Beeper Client API server
     */
    base_url: string;

    /**
     * Listening host
     */
    hostname: string;

    /**
     * Whether MCP endpoint is enabled
     */
    mcp_enabled: boolean;

    /**
     * Listening port
     */
    port: number;

    /**
     * Whether remote access is enabled
     */
    remote_access: boolean;

    /**
     * Server status
     */
    status: string;
  }
}

export declare namespace Info {
  export { type InfoRetrieveResponse as InfoRetrieveResponse };
}
