// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as BridgesAPI from './bridges';
import { APIPromise } from '../../core/api-promise';
import { RequestOptions } from '../../internal/request-options';
import { path } from '../../internal/utils/path';

/**
 * Available bridges, bridge logins, login sessions for connect and reconnect flows, and advanced network capabilities.
 */
export class BaseLoginFlows extends APIResource {
  static override readonly _key: readonly ['bridges', 'loginFlows'] = Object.freeze([
    'bridges',
    'loginFlows',
  ] as const);

  /**
   * List connect and reconnect flow options for a bridge. Use a flowID when creating
   * a bridge login session.
   */
  list(bridgeID: string, options?: RequestOptions): APIPromise<LoginFlowListResponse> {
    return this._client.get(path`/v1/bridges/${bridgeID}/login-flows`, options);
  }
}
/**
 * Available bridges, bridge logins, login sessions for connect and reconnect flows, and advanced network capabilities.
 */
export class LoginFlows extends BaseLoginFlows {}

export interface LoginFlowListResponse {
  items: Array<BridgesAPI.LoginFlow>;
}

export declare namespace LoginFlows {
  export { type LoginFlowListResponse as LoginFlowListResponse };
}
