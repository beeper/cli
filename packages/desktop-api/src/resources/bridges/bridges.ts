// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as BridgesAPI from './bridges';
import * as Shared from '../shared';
import * as AccountsAPI from '../accounts/accounts';
import * as LoginFlowsAPI from './login-flows';
import { BaseLoginFlows, LoginFlowListResponse, LoginFlows } from './login-flows';
import * as LoginsAPI from './logins';
import {
  BaseLogins,
  LoginListResponse,
  LoginRemoveParams,
  LoginRemoveResponse,
  LoginRetrieveParams,
  Logins,
} from './logins';
import * as LoginSessionsAPI from './login-sessions/login-sessions';
import {
  BaseLoginSessions,
  LoginSessionCancelParams,
  LoginSessionCancelResponse,
  LoginSessionCreateParams,
  LoginSessionRetrieveParams,
  LoginSessions,
} from './login-sessions/login-sessions';
import { APIPromise } from '../../core/api-promise';
import { RequestOptions } from '../../internal/request-options';
import { path } from '../../internal/utils/path';

/**
 * Manage available bridges, connect or reconnect chat accounts
 */
export class BaseBridges extends APIResource {
  static override readonly _key: readonly ['bridges'] = Object.freeze(['bridges'] as const);

  /**
   * Get one bridge, including the chat accounts connected through it.
   */
  retrieve(bridgeID: string, options?: RequestOptions): APIPromise<BridgeRetrieveResponse> {
    return this._client.get(path`/v1/bridges/${bridgeID}`, options);
  }

  /**
   * List available bridges. A bridge is a chat-network connector that can connect or
   * reconnect chat accounts. Connected accounts use the same Account schema as GET
   * /v1/accounts.
   */
  list(options?: RequestOptions): APIPromise<BridgeListResponse> {
    return this._client.get('/v1/bridges', options);
  }

  /**
   * Get advanced network capabilities for a bridge. This endpoint is intended for
   * clients that build custom connect or chat-creation flows.
   */
  retrieveCapabilities(bridgeID: string, options?: RequestOptions): APIPromise<ProvisioningCapabilities> {
    return this._client.get(path`/v1/bridges/${bridgeID}/capabilities`, options);
  }
}
/**
 * Manage available bridges, connect or reconnect chat accounts
 */
export class Bridges extends BaseBridges {
  loginFlows: LoginFlowsAPI.LoginFlows = new LoginFlowsAPI.LoginFlows(this._client);
  logins: LoginsAPI.Logins = new LoginsAPI.Logins(this._client);
  loginSessions: LoginSessionsAPI.LoginSessions = new LoginSessionsAPI.LoginSessions(this._client);
}

/**
 * Available bridge that can connect or reconnect chat accounts.
 */
export interface Bridge {
  /**
   * Bridge ID. Use with bridge endpoints.
   */
  id: string;

  /**
   * Connected accounts for this bridge. Uses the same Account schema as GET
   * /v1/accounts.
   */
  accounts: Array<AccountsAPI.Account>;

  /**
   * Number of active accounts for this network on this device.
   */
  activeAccountCount: number;

  /**
   * Human-friendly bridge name shown in Beeper.
   */
  displayName: string;

  /**
   * Where accounts for this bridge run: on this device or in Beeper Cloud.
   */
  provider: 'cloud' | 'self-hosted' | 'local' | 'platform-sdk';

  /**
   * Whether this bridge can currently be used to connect new accounts.
   */
  status: 'available' | 'connected' | 'limit_reached' | 'temporarily_unavailable' | 'disabled';

  /**
   * Whether this bridge can have multiple active accounts for the same network.
   */
  supportsMultipleAccounts: boolean;

  /**
   * Underlying bridge type, such as matrix, discordgo, slackgo, whatsapp, telegram,
   * or twitter.
   */
  type: string;

  /**
   * Network grouping used for account counts and limits.
   */
  network?: string;

  /**
   * Human-friendly status text matching Beeper account management language.
   */
  statusText?: string;
}

/**
 * Signed-in identity for a bridge. One bridge login can contain multiple chat
 * accounts.
 */
export interface BridgeLogin {
  /**
   * Bridge ID.
   */
  bridgeID: string;

  /**
   * Bridge login ID.
   */
  loginID: string;

  removeScopes: Array<'current-device' | 'all-devices'>;

  status: 'connected' | 'connecting' | 'needs_login' | 'logged_out' | 'unknown';

  /**
   * Chat accounts that belong to this bridge login, when known.
   */
  accountIDs?: Array<string>;

  /**
   * Human-friendly bridge login status text.
   */
  statusText?: string;

  /**
   * User the account belongs to.
   */
  user?: Shared.User;
}

export interface CookieField {
  /**
   * Field ID to send back in the fields object.
   */
  id: string;

  /**
   * Cookie, header, or local storage key to collect.
   */
  name?: string;

  /**
   * Browser storage source for this value.
   */
  type?: 'cookie' | 'header' | 'local_storage';
}

/**
 * Disappearing-message timer capability.
 */
export interface DisappearingTimerCapability {
  types: Array<'' | 'after_read' | 'after_send'>;

  omit_empty_timer?: true;

  timers?: Array<number>;
}

/**
 * Group creation field capability.
 */
export interface GroupFieldCapability {
  allowed: boolean;

  max_length?: number;

  min_length?: number;

  required?: boolean;

  /**
   * Disappearing-message timer capability.
   */
  settings?: DisappearingTimerCapability;
}

/**
 * Group creation capabilities for one group type.
 */
export interface GroupTypeCapabilities {
  type_description: string;

  /**
   * Group creation field capability.
   */
  avatar?: GroupFieldCapability;

  /**
   * Group creation field capability.
   */
  disappear?: GroupFieldCapability;

  /**
   * Group creation field capability.
   */
  name?: GroupFieldCapability;

  /**
   * Group creation field capability.
   */
  parent?: GroupFieldCapability;

  /**
   * Group creation field capability.
   */
  participants?: GroupFieldCapability;

  /**
   * Group creation field capability.
   */
  topic?: GroupFieldCapability;

  /**
   * Group creation field capability.
   */
  username?: GroupFieldCapability;
}

/**
 * Connect or reconnect flow option for a bridge.
 */
export interface LoginFlow {
  /**
   * Flow ID to pass when creating a bridge login session.
   */
  id: string;

  /**
   * Short explanation for when to use this flow, when provided.
   */
  description?: string;

  /**
   * Display name for the flow, when provided.
   */
  name?: string;
}

export interface LoginInputField {
  /**
   * Field ID to send back in the fields object.
   */
  id: string;

  /**
   * Initial field value, when provided by the network.
   */
  initialValue?: string;

  /**
   * Field label to show to the user.
   */
  label?: string;

  /**
   * True if the user can leave this field empty.
   */
  optional?: boolean;

  /**
   * Placeholder text to show when the field is empty.
   */
  placeholder?: string;

  /**
   * Suggested input type, such as text, password, or email.
   */
  type?: string;
}

export interface LoginSession {
  /**
   * Bridge ID.
   */
  bridgeID: string;

  /**
   * Temporary bridge login session ID.
   */
  loginSessionID: string;

  status:
    | 'waiting_for_input'
    | 'waiting_for_cookies'
    | 'waiting_for_display'
    | 'complete'
    | 'cancelled'
    | 'failed';

  /**
   * A chat account added to Beeper.
   */
  account?: AccountsAPI.Account;

  /**
   * Chat account ID for reconnect flows, when known.
   */
  accountID?: string;

  /**
   * Step the client should show or complete next. Omitted when the session is
   * complete, cancelled, or failed.
   */
  currentStep?:
    | LoginSession.UserInput
    | LoginSession.Cookies
    | LoginSession.DisplayAndWait
    | LoginSession.Complete;

  error?: Shared.APIError;

  /**
   * Signed-in identity for a bridge. One bridge login can contain multiple chat
   * accounts.
   */
  login?: BridgeLogin;

  /**
   * Bridge login ID for reconnect flows, when known.
   */
  loginID?: string;
}

export namespace LoginSession {
  export interface UserInput {
    fields: Array<BridgesAPI.LoginInputField>;

    stepID: string;

    type: 'user_input';

    attachments?: Array<unknown>;

    /**
     * User-facing instructions for this step.
     */
    instructions?: string;
  }

  export interface Cookies {
    fields: Array<BridgesAPI.CookieField>;

    stepID: string;

    type: 'cookies';

    /**
     * URL to open for the user.
     */
    url: string;

    /**
     * Regular expression that identifies the final URL after sign-in.
     */
    expectedFinalURLRegex?: string;

    /**
     * Optional extraction script for browser-based sign-in helpers. Treat as an opaque
     * helper value.
     */
    extractJS?: string;

    /**
     * User-facing instructions for this browser step.
     */
    instructions?: string;

    /**
     * Suggested user agent for the browser session.
     */
    userAgent?: string;
  }

  export interface DisplayAndWait {
    display: DisplayAndWait.QRCode | DisplayAndWait.Emoji | DisplayAndWait.Empty;

    stepID: string;

    type: 'display_and_wait';

    /**
     * User-facing instructions for this step.
     */
    instructions?: string;
  }

  export namespace DisplayAndWait {
    export interface QRCode {
      data: string;

      type: 'qr';
    }

    export interface Emoji {
      imageURL: string;

      type: 'emoji';
    }

    export interface Empty {
      type: 'nothing';
    }
  }

  export interface Complete {
    type: 'complete';

    /**
     * A chat account added to Beeper.
     */
    account?: AccountsAPI.Account;

    /**
     * Completion instructions, when provided.
     */
    instructions?: string;

    /**
     * Signed-in identity for a bridge. One bridge login can contain multiple chat
     * accounts.
     */
    login?: BridgesAPI.BridgeLogin;

    stepID?: string;
  }
}

/**
 * Advanced network capabilities for account lookup and group creation.
 */
export interface ProvisioningCapabilities {
  group_creation: { [key: string]: GroupTypeCapabilities };

  /**
   * Identifier lookup capabilities for this bridge.
   */
  resolve_identifier: ResolveIdentifierCapabilities;

  image_pack_import?: boolean;
}

/**
 * Identifier lookup capabilities for this bridge.
 */
export interface ResolveIdentifierCapabilities {
  any_phone: boolean;

  contact_list: boolean;

  create_dm: boolean;

  lookup_email: boolean;

  lookup_phone: boolean;

  lookup_username: boolean;

  search: boolean;
}

/**
 * Available bridge that can connect or reconnect chat accounts.
 */
export interface BridgeRetrieveResponse {
  /**
   * Bridge ID. Use with bridge endpoints.
   */
  id: string;

  /**
   * Connected accounts for this bridge. Uses the same Account schema as GET
   * /v1/accounts.
   */
  accounts: Array<AccountsAPI.Account>;

  /**
   * Number of active accounts for this network on this device.
   */
  activeAccountCount: number;

  /**
   * Human-friendly bridge name shown in Beeper.
   */
  displayName: string;

  /**
   * Where accounts for this bridge run: on this device or in Beeper Cloud.
   */
  provider: 'cloud' | 'self-hosted' | 'local' | 'platform-sdk';

  /**
   * Whether this bridge can currently be used to connect new accounts.
   */
  status: 'available' | 'connected' | 'limit_reached' | 'temporarily_unavailable' | 'disabled';

  /**
   * Whether this bridge can have multiple active accounts for the same network.
   */
  supportsMultipleAccounts: boolean;

  /**
   * Underlying bridge type, such as matrix, discordgo, slackgo, whatsapp, telegram,
   * or twitter.
   */
  type: string;

  /**
   * Network grouping used for account counts and limits.
   */
  network?: string;

  /**
   * Human-friendly status text matching Beeper account management language.
   */
  statusText?: string;
}

/**
 * Available bridges and their connected accounts.
 */
export interface BridgeListResponse {
  items: Array<Bridge>;
}

Bridges.LoginFlows = LoginFlows;
Bridges.BaseLoginFlows = BaseLoginFlows;
Bridges.Logins = Logins;
Bridges.BaseLogins = BaseLogins;
Bridges.LoginSessions = LoginSessions;
Bridges.BaseLoginSessions = BaseLoginSessions;

export declare namespace Bridges {
  export {
    type Bridge as Bridge,
    type BridgeLogin as BridgeLogin,
    type CookieField as CookieField,
    type DisappearingTimerCapability as DisappearingTimerCapability,
    type GroupFieldCapability as GroupFieldCapability,
    type GroupTypeCapabilities as GroupTypeCapabilities,
    type LoginFlow as LoginFlow,
    type LoginInputField as LoginInputField,
    type LoginSession as LoginSession,
    type ProvisioningCapabilities as ProvisioningCapabilities,
    type ResolveIdentifierCapabilities as ResolveIdentifierCapabilities,
    type BridgeRetrieveResponse as BridgeRetrieveResponse,
    type BridgeListResponse as BridgeListResponse,
  };

  export {
    LoginFlows as LoginFlows,
    BaseLoginFlows as BaseLoginFlows,
    type LoginFlowListResponse as LoginFlowListResponse,
  };

  export {
    Logins as Logins,
    BaseLogins as BaseLogins,
    type LoginListResponse as LoginListResponse,
    type LoginRemoveResponse as LoginRemoveResponse,
    type LoginRetrieveParams as LoginRetrieveParams,
    type LoginRemoveParams as LoginRemoveParams,
  };

  export {
    LoginSessions as LoginSessions,
    BaseLoginSessions as BaseLoginSessions,
    type LoginSessionCancelResponse as LoginSessionCancelResponse,
    type LoginSessionCreateParams as LoginSessionCreateParams,
    type LoginSessionRetrieveParams as LoginSessionRetrieveParams,
    type LoginSessionCancelParams as LoginSessionCancelParams,
  };
}
