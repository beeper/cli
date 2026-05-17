// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import * as Shared from './shared';
import { MessagesCursorNoLimit, MessagesCursorSearch } from './shared';
import { APIPromise } from '../core/api-promise';
import {
  CursorNoLimit,
  type CursorNoLimitParams,
  CursorSearch,
  type CursorSearchParams,
  PagePromise,
} from '../core/pagination';
import { buildHeaders } from '../internal/headers';
import { RequestOptions } from '../internal/request-options';
import { path } from '../internal/utils/path';

/**
 * Manage messages in chats
 */
export class BaseMessages extends APIResource {
  static override readonly _key: readonly ['messages'] = Object.freeze(['messages'] as const);

  /**
   * Retrieve a message by final message ID, pendingMessageID, or Matrix event ID.
   * chatID may be a Beeper chat ID or a local chat ID.
   *
   * @example
   * ```ts
   * const message = await client.messages.retrieve('1343993', {
   *   chatID: '!NCdzlIaMjZUmvmvyHU:beeper.com',
   * });
   * ```
   */
  retrieve(
    messageID: string,
    params: MessageRetrieveParams,
    options?: RequestOptions,
  ): APIPromise<Shared.Message> {
    const { chatID } = params;
    return this._client.get(path`/v1/chats/${chatID}/messages/${messageID}`, options);
  }

  /**
   * Edit the text content of an existing message. Messages with attachments cannot
   * be edited.
   *
   * @example
   * ```ts
   * const message = await client.messages.update('1343993', {
   *   chatID: '!NCdzlIaMjZUmvmvyHU:beeper.com',
   *   text: 'x',
   * });
   * ```
   */
  update(
    messageID: string,
    params: MessageUpdateParams,
    options?: RequestOptions,
  ): APIPromise<MessageUpdateResponse> {
    const { chatID, ...body } = params;
    return this._client.put(path`/v1/chats/${chatID}/messages/${messageID}`, { body, ...options });
  }

  /**
   * List all messages in a chat with cursor-based pagination. Sorted by timestamp.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const message of client.messages.list(
   *   '!NCdzlIaMjZUmvmvyHU:beeper.com',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(
    chatID: string,
    query: MessageListParams | null | undefined = {},
    options?: RequestOptions,
  ): PagePromise<MessagesCursorNoLimit, Shared.Message> {
    return this._client.getAPIList(path`/v1/chats/${chatID}/messages`, CursorNoLimit<Shared.Message>, {
      query,
      ...options,
    });
  }

  /**
   * Delete a message by final message ID. Pending message IDs are not accepted
   * because messages cannot be deleted while sending.
   *
   * @example
   * ```ts
   * await client.messages.delete('1343993', {
   *   chatID: '!NCdzlIaMjZUmvmvyHU:beeper.com',
   * });
   * ```
   */
  delete(messageID: string, params: MessageDeleteParams, options?: RequestOptions): APIPromise<void> {
    const { chatID, forEveryone } = params;
    return this._client.delete(path`/v1/chats/${chatID}/messages/${messageID}`, {
      query: { forEveryone },
      ...options,
      headers: buildHeaders([{ Accept: '*/*' }, options?.headers]),
    });
  }

  /**
   * Search messages across chats.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const message of client.messages.search()) {
   *   // ...
   * }
   * ```
   */
  search(
    query: MessageSearchParams | null | undefined = {},
    options?: RequestOptions,
  ): PagePromise<MessagesCursorSearch, Shared.Message> {
    return this._client.getAPIList('/v1/messages/search', CursorSearch<Shared.Message>, {
      query,
      ...options,
    });
  }

  /**
   * Send a text message to a specific chat. Supports replying to existing messages.
   * Returns a pending message ID.
   *
   * @example
   * ```ts
   * const response = await client.messages.send(
   *   '!NCdzlIaMjZUmvmvyHU:beeper.com',
   * );
   * ```
   */
  send(
    chatID: string,
    body: MessageSendParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<MessageSendResponse> {
    return this._client.post(path`/v1/chats/${chatID}/messages`, { body, ...options });
  }
}
/**
 * Manage messages in chats
 */
export class Messages extends BaseMessages {}

export interface MessageUpdateResponse extends Shared.Message {
  /**
   * @deprecated Use id instead.
   */
  messageID: string;

  /**
   * @deprecated Use the HTTP 200 response status instead.
   */
  success: true;
}

export interface MessageSendResponse {
  /**
   * Chat ID. Input routes also accept the local chat ID from this installation when
   * available.
   */
  chatID: string;

  /**
   * Pending ID assigned to the message before the network confirms the send. Pass it
   * to GET /v1/chats/{chatID}/messages/{messageID} to resolve, or wait for the
   * matching message.upserted over the WebSocket.
   */
  pendingMessageID: string;
}

export interface MessageRetrieveParams {
  /**
   * Chat ID. Input routes also accept the local chat ID from this installation when
   * available.
   */
  chatID: string;
}

export interface MessageUpdateParams {
  /**
   * Path param: Chat ID. Input routes also accept the local chat ID from this
   * installation when available.
   */
  chatID: string;

  /**
   * Body param: New text content for the message
   */
  text: string;
}

export interface MessageListParams extends CursorNoLimitParams {}

export interface MessageDeleteParams {
  /**
   * Path param: Chat ID. Input routes also accept the local chat ID from this
   * installation when available.
   */
  chatID: string;

  /**
   * Query param: True to request deletion for everyone when the network supports it;
   * false to delete only for the authenticated user when supported.
   */
  forEveryone?: boolean | null;
}

export interface MessageSearchParams extends CursorSearchParams {
  /**
   * Limit search to specific account IDs.
   */
  accountIDs?: Array<string>;

  /**
   * Limit search to specific chat IDs.
   */
  chatIDs?: Array<string>;

  /**
   * Filter by chat type: 'group' for group chats, 'single' for 1:1 chats.
   */
  chatType?: 'group' | 'single';

  /**
   * Only include messages with timestamp strictly after this ISO 8601 datetime
   * (e.g., '2024-07-01T00:00:00Z' or '2024-07-01T00:00:00+02:00').
   */
  dateAfter?: string;

  /**
   * Only include messages with timestamp strictly before this ISO 8601 datetime
   * (e.g., '2024-07-31T23:59:59Z' or '2024-07-31T23:59:59+02:00').
   */
  dateBefore?: string;

  /**
   * Exclude messages marked Low Priority by the user. Default: true. Set to false to
   * include all.
   */
  excludeLowPriority?: boolean | null;

  /**
   * Include messages in chats marked as Muted by the user, which are usually less
   * important. Default: true. Set to false if the user wants a more refined search.
   */
  includeMuted?: boolean | null;

  /**
   * Filter messages by media types. Use ['any'] for any media type, or specify exact
   * types like ['video', 'image']. Omit for no media filtering.
   */
  mediaTypes?: Array<'any' | 'video' | 'image' | 'link' | 'file'>;

  /**
   * Literal word search. Finds messages containing these words in any order. Use
   * words the user actually typed, not inferred concepts. Example: use "dinner"
   * rather than "dinner plans". If omitted, returns results filtered only by the
   * other parameters.
   */
  query?: string;

  /**
   * Filter by sender: 'me' (messages sent by the authenticated user), 'others'
   * (messages sent by others), or a specific user ID string (user.id).
   */
  sender?: string;
}

export interface MessageSendParams {
  /**
   * Single attachment to send with the message
   */
  attachment?: MessageSendParams.Attachment;

  /**
   * Provide a message ID to send this as a reply to an existing message
   */
  replyToMessageID?: string;

  /**
   * Draft text. Plain text and Markdown are converted to Beeper rich text with the
   * same rules used by send and edit.
   */
  text?: string;
}

export namespace MessageSendParams {
  /**
   * Single attachment to send with the message
   */
  export interface Attachment {
    /**
     * Upload ID from uploadAsset endpoint. Required to reference uploaded files.
     */
    uploadID: string;

    /**
     * Duration in seconds (optional override of cached value)
     */
    duration?: number;

    /**
     * Filename (optional override of cached value)
     */
    fileName?: string;

    /**
     * MIME type (optional override of cached value)
     */
    mimeType?: string;

    /**
     * Dimensions (optional override of cached value)
     */
    size?: Attachment.Size;

    /**
     * Attachment type hint (image, video, audio, file, gif, voice-note, sticker). If
     * omitted, auto-detected from mimeType
     */
    type?: 'image' | 'video' | 'audio' | 'file' | 'gif' | 'voice-note' | 'sticker';
  }

  export namespace Attachment {
    /**
     * Dimensions (optional override of cached value)
     */
    export interface Size {
      height: number;

      width: number;
    }
  }
}

export declare namespace Messages {
  export {
    type MessageUpdateResponse as MessageUpdateResponse,
    type MessageSendResponse as MessageSendResponse,
    type MessageRetrieveParams as MessageRetrieveParams,
    type MessageUpdateParams as MessageUpdateParams,
    type MessageListParams as MessageListParams,
    type MessageDeleteParams as MessageDeleteParams,
    type MessageSearchParams as MessageSearchParams,
    type MessageSendParams as MessageSendParams,
  };
}

export { type MessagesCursorNoLimit, type MessagesCursorSearch };
