// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as Shared from '../shared';
import { UsersCursorSearch } from '../shared';
import { APIPromise } from '../../core/api-promise';
import { CursorSearch, type CursorSearchParams, PagePromise } from '../../core/pagination';
import { RequestOptions } from '../../internal/request-options';
import { path } from '../../internal/utils/path';

/**
 * Manage contacts on a specific account
 */
export class BaseContacts extends APIResource {
  static override readonly _key: readonly ['accounts', 'contacts'] = Object.freeze([
    'accounts',
    'contacts',
  ] as const);

  /**
   * List merged contacts for a specific account with cursor-based pagination.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const user of client.accounts.contacts.list(
   *   'accountID',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(
    accountID: string,
    query: ContactListParams | null | undefined = {},
    options?: RequestOptions,
  ): PagePromise<UsersCursorSearch, Shared.User> {
    return this._client.getAPIList(path`/v1/accounts/${accountID}/contacts/list`, CursorSearch<Shared.User>, {
      query,
      ...options,
    });
  }

  /**
   * Search contacts on a specific account using merged account contacts, network
   * search, and exact identifier lookup.
   *
   * @example
   * ```ts
   * const response = await client.accounts.contacts.search(
   *   'accountID',
   *   { query: 'x' },
   * );
   * ```
   */
  search(
    accountID: string,
    query: ContactSearchParams,
    options?: RequestOptions,
  ): APIPromise<ContactSearchResponse> {
    return this._client.get(path`/v1/accounts/${accountID}/contacts`, { query, ...options });
  }
}
/**
 * Manage contacts on a specific account
 */
export class Contacts extends BaseContacts {}

export interface ContactSearchResponse {
  items: Array<Shared.User>;
}

export interface ContactListParams extends CursorSearchParams {
  /**
   * Optional search query for contact lookup.
   */
  query?: string;
}

export interface ContactSearchParams {
  /**
   * Text to search contacts by. Matching behavior depends on the network.
   */
  query: string;
}

export declare namespace Contacts {
  export {
    type ContactSearchResponse as ContactSearchResponse,
    type ContactListParams as ContactListParams,
    type ContactSearchParams as ContactSearchParams,
  };
}

export { type UsersCursorSearch };
