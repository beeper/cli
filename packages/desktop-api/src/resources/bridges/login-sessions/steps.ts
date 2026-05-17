// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../../core/resource';
import * as BridgesAPI from '../bridges';
import { APIPromise } from '../../../core/api-promise';
import { RequestOptions } from '../../../internal/request-options';
import { path } from '../../../internal/utils/path';

/**
 * Available bridges, bridge logins, login sessions for connect and reconnect flows, and advanced network capabilities.
 */
export class BaseSteps extends APIResource {
  static override readonly _key: readonly ['bridges', 'loginSessions', 'steps'] = Object.freeze([
    'bridges',
    'loginSessions',
    'steps',
  ] as const);

  /**
   * Submit input for the current step of a bridge login session.
   */
  submit(
    stepID: string,
    params: StepSubmitParams,
    options?: RequestOptions,
  ): APIPromise<BridgesAPI.LoginSession> {
    const { bridgeID, loginSessionID, ...body } = params;
    return this._client.post(path`/v1/bridges/${bridgeID}/login-sessions/${loginSessionID}/steps/${stepID}`, {
      body,
      ...options,
    });
  }
}
/**
 * Available bridges, bridge logins, login sessions for connect and reconnect flows, and advanced network capabilities.
 */
export class Steps extends BaseSteps {}

export interface StepSubmitParams {
  /**
   * Path param: Bridge ID.
   */
  bridgeID: string;

  /**
   * Path param: Temporary bridge login session ID.
   */
  loginSessionID: string;

  /**
   * Body param
   */
  type: 'user_input' | 'cookies' | 'display_and_wait';

  /**
   * Body param: Field values keyed by the field IDs from the current step.
   */
  fields?: { [key: string]: string };

  /**
   * Body param: Last browser URL reached during a cookies step, if available.
   */
  lastURL?: string;

  /**
   * Body param: How the step was completed. Omit unless the client needs to
   * distinguish an embedded webview or browser extension.
   */
  source?: 'api' | 'webview' | 'browser_extension';
}

export declare namespace Steps {
  export { type StepSubmitParams as StepSubmitParams };
}
