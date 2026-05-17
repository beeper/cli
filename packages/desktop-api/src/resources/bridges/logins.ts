// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as BridgesAPI from './bridges';
import { APIPromise } from '../../core/api-promise';
import { RequestOptions } from '../../internal/request-options';
import { path } from '../../internal/utils/path';

/**
 * Available bridges, bridge logins, login sessions for connect and reconnect flows, and advanced network capabilities.
 */
export class BaseLogins extends APIResource {
  static override readonly _key: readonly ['bridges', 'logins'] = Object.freeze([
    'bridges',
    'logins',
  ] as const);

  /**
   * Get one bridge login.
   */
  retrieve(
    loginID: string,
    params: LoginRetrieveParams,
    options?: RequestOptions,
  ): APIPromise<BridgesAPI.BridgeLogin> {
    const { bridgeID } = params;
    return this._client.get(path`/v1/bridges/${bridgeID}/logins/${loginID}`, options);
  }

  /**
   * List bridge logins. A bridge login is a signed-in identity for a bridge and can
   * contain one or more chat accounts.
   */
  list(bridgeID: string, options?: RequestOptions): APIPromise<LoginListResponse> {
    return this._client.get(path`/v1/bridges/${bridgeID}/logins`, options);
  }

  /**
   * Remove a bridge login from this device or, when supported by the bridge, from
   * all devices.
   */
  remove(
    loginID: string,
    params: LoginRemoveParams,
    options?: RequestOptions,
  ): APIPromise<LoginRemoveResponse> {
    const { bridgeID, ...body } = params;
    return this._client.post(path`/v1/bridges/${bridgeID}/logins/${loginID}/remove`, { body, ...options });
  }
}
/**
 * Available bridges, bridge logins, login sessions for connect and reconnect flows, and advanced network capabilities.
 */
export class Logins extends BaseLogins {}

export interface LoginListResponse {
  items: Array<BridgesAPI.BridgeLogin>;
}

export interface LoginRemoveResponse {
  bridgeID: string;

  loginID: string;

  /**
   * Where this bridge login should be removed.
   */
  scope: 'current-device' | 'all-devices';

  status: 'removed';

  affectedAccountIDs?: Array<string>;
}

export interface LoginRetrieveParams {
  /**
   * Bridge ID.
   */
  bridgeID: string;
}

export interface LoginRemoveParams {
  /**
   * Path param: Bridge ID.
   */
  bridgeID: string;

  /**
   * Body param: Where this bridge login should be removed.
   */
  scope: 'current-device' | 'all-devices';
}

export declare namespace Logins {
  export {
    type LoginListResponse as LoginListResponse,
    type LoginRemoveResponse as LoginRemoveResponse,
    type LoginRetrieveParams as LoginRetrieveParams,
    type LoginRemoveParams as LoginRemoveParams,
  };
}
