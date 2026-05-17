// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as Shared from '../shared';
import * as ContactsAPI from './contacts';
import {
  BaseContacts,
  ContactListParams,
  ContactSearchParams,
  ContactSearchResponse,
  Contacts,
} from './contacts';
import { APIPromise } from '../../core/api-promise';
import { RequestOptions } from '../../internal/request-options';
import { path } from '../../internal/utils/path';

/**
 * Manage connected chat accounts
 */
export class BaseAccounts extends APIResource {
  static override readonly _key: readonly ['accounts'] = Object.freeze(['accounts'] as const);

  /**
   * Get one chat account connected to this Beeper Client API server.
   *
   * @example
   * ```ts
   * const account = await client.accounts.retrieve('accountID');
   * ```
   */
  retrieve(accountID: string, options?: RequestOptions): APIPromise<AccountRetrieveResponse> {
    return this._client.get(path`/v1/accounts/${accountID}`, options);
  }

  /**
   * List chat accounts connected to this Beeper Client API server, including bridge,
   * network, user identity, and connection status.
   *
   * @example
   * ```ts
   * const accounts = await client.accounts.list();
   * ```
   */
  list(options?: RequestOptions): APIPromise<AccountListResponse> {
    return this._client.get('/v1/accounts', options);
  }
}
/**
 * Manage connected chat accounts
 */
export class Accounts extends BaseAccounts {
  contacts: ContactsAPI.Contacts = new ContactsAPI.Contacts(this._client);
}

/**
 * A chat account added to Beeper.
 */
export interface Account {
  /**
   * Chat account added to Beeper. Use this to route account-scoped actions. Examples
   * include matrix for Beeper/Matrix, discordgo for a cloud bridge,
   * slackgo.TEAM-USER for workspace-scoped cloud bridges, and local-whatsapp*ba*...
   * for local bridges.
   */
  accountID: string;

  /**
   * Bridge metadata for the account. Available in Beeper Desktop v4.2.785+.
   */
  bridge: AccountBridge;

  /**
   * Current connection status for this account.
   */
  status:
    | 'connected'
    | 'connecting'
    | 'backfilling'
    | 'connection_required'
    | 'reconnect_required'
    | 'attention_required'
    | 'disconnected'
    | 'disabled';

  /**
   * User the account belongs to.
   */
  user: Shared.User;

  /**
   * Runtime chat/message capabilities for this connected account, when available.
   */
  capabilities?: { [key: string]: unknown };

  /**
   * Bridge login ID for this account, when known. One bridge login can contain
   * multiple chat accounts.
   */
  loginID?: string;

  /**
   * Human-friendly network name for the account. Omitted when the network is
   * unknown.
   */
  network?: string;

  /**
   * Human-friendly account status text.
   */
  statusText?: string;
}

/**
 * Bridge metadata for the account. Available in Beeper Desktop v4.2.785+.
 */
export interface AccountBridge {
  /**
   * Bridge identifier. Beeper Cloud accounts often use the network type (for example
   * matrix or discordgo); on-device accounts use a local bridge ID (for example
   * local-whatsapp). Available in Beeper Desktop v4.2.785+.
   */
  id: string;

  /**
   * Where this account runs: on this device or in Beeper Cloud. Available in Beeper
   * Desktop v4.2.785+.
   */
  provider: 'cloud' | 'self-hosted' | 'local' | 'platform-sdk';

  /**
   * Bridge type, such as matrix, discordgo, slackgo, whatsapp, telegram, or twitter.
   * Available in Beeper Desktop v4.2.785+.
   */
  type: string;
}

/**
 * A chat account added to Beeper.
 */
export interface AccountRetrieveResponse {
  /**
   * Chat account added to Beeper. Use this to route account-scoped actions. Examples
   * include matrix for Beeper/Matrix, discordgo for a cloud bridge,
   * slackgo.TEAM-USER for workspace-scoped cloud bridges, and local-whatsapp*ba*...
   * for local bridges.
   */
  accountID: string;

  /**
   * Bridge metadata for the account. Available in Beeper Desktop v4.2.785+.
   */
  bridge: AccountBridge;

  /**
   * Current connection status for this account.
   */
  status:
    | 'connected'
    | 'connecting'
    | 'backfilling'
    | 'connection_required'
    | 'reconnect_required'
    | 'attention_required'
    | 'disconnected'
    | 'disabled';

  /**
   * User the account belongs to.
   */
  user: Shared.User;

  /**
   * Runtime chat/message capabilities for this connected account, when available.
   */
  capabilities?: { [key: string]: unknown };

  /**
   * Bridge login ID for this account, when known. One bridge login can contain
   * multiple chat accounts.
   */
  loginID?: string;

  /**
   * Human-friendly network name for the account. Omitted when the network is
   * unknown.
   */
  network?: string;

  /**
   * Human-friendly account status text.
   */
  statusText?: string;
}

/**
 * Chat accounts configured on this device. Includes accountID, bridge metadata,
 * optional network name, and user identity.
 */
export type AccountListResponse = Array<Account>;

Accounts.Contacts = Contacts;
Accounts.BaseContacts = BaseContacts;

export declare namespace Accounts {
  export {
    type Account as Account,
    type AccountBridge as AccountBridge,
    type AccountRetrieveResponse as AccountRetrieveResponse,
    type AccountListResponse as AccountListResponse,
  };

  export {
    Contacts as Contacts,
    BaseContacts as BaseContacts,
    type ContactSearchResponse as ContactSearchResponse,
    type ContactListParams as ContactListParams,
    type ContactSearchParams as ContactSearchParams,
  };
}
