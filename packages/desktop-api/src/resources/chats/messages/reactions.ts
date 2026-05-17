// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../../core/resource';
import { APIPromise } from '../../../core/api-promise';
import { RequestOptions } from '../../../internal/request-options';
import { path } from '../../../internal/utils/path';

/**
 * Manage message reactions
 */
export class BaseReactions extends APIResource {
  static override readonly _key: readonly ['chats', 'messages', 'reactions'] = Object.freeze([
    'chats',
    'messages',
    'reactions',
  ] as const);

  /**
   * Remove the reaction added by the authenticated user from an existing message.
   *
   * @example
   * ```ts
   * const reaction =
   *   await client.chats.messages.reactions.delete('x', {
   *     chatID: '!NCdzlIaMjZUmvmvyHU:beeper.com',
   *     messageID: '1343993',
   *   });
   * ```
   */
  delete(
    reactionKey: string,
    params: ReactionDeleteParams,
    options?: RequestOptions,
  ): APIPromise<ReactionDeleteResponse> {
    const { chatID, messageID } = params;
    return this._client.delete(
      path`/v1/chats/${chatID}/messages/${messageID}/reactions/${reactionKey}`,
      options,
    );
  }

  /**
   * Add a reaction to an existing message.
   *
   * @example
   * ```ts
   * const response = await client.chats.messages.reactions.add(
   *   '1343993',
   *   {
   *     chatID: '!NCdzlIaMjZUmvmvyHU:beeper.com',
   *     reactionKey: 'x',
   *   },
   * );
   * ```
   */
  add(
    messageID: string,
    params: ReactionAddParams,
    options?: RequestOptions,
  ): APIPromise<ReactionAddResponse> {
    const { chatID, ...body } = params;
    return this._client.post(path`/v1/chats/${chatID}/messages/${messageID}/reactions`, { body, ...options });
  }
}
/**
 * Manage message reactions
 */
export class Reactions extends BaseReactions {}

export interface ReactionDeleteResponse {
  /**
   * Chat ID. Input routes also accept the local chat ID from this installation when
   * available.
   */
  chatID: string;

  /**
   * Message ID.
   */
  messageID: string;

  /**
   * Reaction key that was removed.
   */
  reactionKey: string;

  /**
   * Always true. Indicates the reaction removal was queued; failures return an error
   * response.
   */
  success: true;
}

export interface ReactionAddResponse {
  /**
   * Chat ID. Input routes also accept the local chat ID from this installation when
   * available.
   */
  chatID: string;

  /**
   * Message ID.
   */
  messageID: string;

  /**
   * Reaction key that was added.
   */
  reactionKey: string;

  /**
   * Always true. Indicates the reaction was queued; failures return an error
   * response.
   */
  success: true;

  /**
   * Transaction ID used for send tracking.
   */
  transactionID: string;
}

export interface ReactionDeleteParams {
  /**
   * Chat ID. Input routes also accept the local chat ID from this installation when
   * available.
   */
  chatID: string;

  /**
   * Message ID.
   */
  messageID: string;
}

export interface ReactionAddParams {
  /**
   * Path param: Chat ID. Input routes also accept the local chat ID from this
   * installation when available.
   */
  chatID: string;

  /**
   * Body param: Reaction key to add (emoji, shortcode, or custom emoji key)
   */
  reactionKey: string;

  /**
   * Body param: Optional transaction ID for deduplication and send tracking
   */
  transactionID?: string;
}

export declare namespace Reactions {
  export {
    type ReactionDeleteResponse as ReactionDeleteResponse,
    type ReactionAddResponse as ReactionAddResponse,
    type ReactionDeleteParams as ReactionDeleteParams,
    type ReactionAddParams as ReactionAddParams,
  };
}
