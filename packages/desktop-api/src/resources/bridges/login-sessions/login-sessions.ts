// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../../core/resource';
import * as BridgesAPI from '../bridges';
import * as StepsAPI from './steps';
import { BaseSteps, StepSubmitParams, Steps } from './steps';
import { APIPromise } from '../../../core/api-promise';
import { RequestOptions } from '../../../internal/request-options';
import { path } from '../../../internal/utils/path';

/**
 * Available bridges, bridge logins, login sessions for connect and reconnect flows, and advanced network capabilities.
 */
export class BaseLoginSessions extends APIResource {
  static override readonly _key: readonly ['bridges', 'loginSessions'] = Object.freeze([
    'bridges',
    'loginSessions',
  ] as const);

  /**
   * Start a temporary bridge login session to connect a new chat account or
   * reconnect an existing bridge login. Omit loginID and accountID to connect a new
   * account.
   */
  create(
    bridgeID: string,
    body: LoginSessionCreateParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<BridgesAPI.LoginSession> {
    return this._client.post(path`/v1/bridges/${bridgeID}/login-sessions`, { body, ...options });
  }

  /**
   * Get the current state of a temporary bridge login session.
   */
  retrieve(
    loginSessionID: string,
    params: LoginSessionRetrieveParams,
    options?: RequestOptions,
  ): APIPromise<BridgesAPI.LoginSession> {
    const { bridgeID } = params;
    return this._client.get(path`/v1/bridges/${bridgeID}/login-sessions/${loginSessionID}`, options);
  }

  /**
   * Cancel a temporary bridge login session.
   */
  cancel(
    loginSessionID: string,
    params: LoginSessionCancelParams,
    options?: RequestOptions,
  ): APIPromise<LoginSessionCancelResponse> {
    const { bridgeID } = params;
    return this._client.delete(path`/v1/bridges/${bridgeID}/login-sessions/${loginSessionID}`, options);
  }
}
/**
 * Available bridges, bridge logins, login sessions for connect and reconnect flows, and advanced network capabilities.
 */
export class LoginSessions extends BaseLoginSessions {
  steps: StepsAPI.Steps = new StepsAPI.Steps(this._client);
}

export interface LoginSessionCancelResponse {
  bridgeID: string;

  loginSessionID: string;

  status: 'cancelled';
}

export interface LoginSessionCreateParams {
  /**
   * Existing chat account ID to reconnect. Omit to connect a new account.
   */
  accountID?: string;

  /**
   * Optional flow ID returned by the list login flows endpoint. If omitted, Beeper
   * chooses the default flow.
   */
  flowID?: string;

  /**
   * Existing bridge login ID to reconnect. Omit to connect a new account.
   */
  loginID?: string;
}

export interface LoginSessionRetrieveParams {
  /**
   * Bridge ID.
   */
  bridgeID: string;
}

export interface LoginSessionCancelParams {
  /**
   * Bridge ID.
   */
  bridgeID: string;
}

LoginSessions.Steps = Steps;
LoginSessions.BaseSteps = BaseSteps;

export declare namespace LoginSessions {
  export {
    type LoginSessionCancelResponse as LoginSessionCancelResponse,
    type LoginSessionCreateParams as LoginSessionCreateParams,
    type LoginSessionRetrieveParams as LoginSessionRetrieveParams,
    type LoginSessionCancelParams as LoginSessionCancelParams,
  };

  export { Steps as Steps, BaseSteps as BaseSteps, type StepSubmitParams as StepSubmitParams };
}
