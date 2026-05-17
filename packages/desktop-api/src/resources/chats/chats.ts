// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as Shared from '../shared';
import * as RemindersAPI from './reminders';
import { BaseReminders, ReminderCreateParams, Reminders } from './reminders';
import * as MessagesAPI from './messages/messages';
import { BaseMessages, Messages } from './messages/messages';
import { APIPromise } from '../../core/api-promise';
import {
  CursorNoLimit,
  type CursorNoLimitParams,
  CursorSearch,
  type CursorSearchParams,
  PagePromise,
} from '../../core/pagination';
import { buildHeaders } from '../../internal/headers';
import { RequestOptions } from '../../internal/request-options';
import { path } from '../../internal/utils/path';

/**
 * Manage chats
 */
export class BaseChats extends APIResource {
  static override readonly _key: readonly ['chats'] = Object.freeze(['chats'] as const);

  /**
   * Create a direct or group chat from participant IDs. Returns the created chat.
   *
   * @example
   * ```ts
   * const chat = await client.chats.create({
   *   accountID: 'accountID',
   *   participantIDs: ['string'],
   *   type: 'single',
   * });
   * ```
   */
  create(body: ChatCreateParams, options?: RequestOptions): APIPromise<ChatCreateResponse> {
    return this._client.post('/v1/chats', { body, ...options });
  }

  /**
   * Retrieve chat details, including metadata, participants, and the latest message.
   *
   * @example
   * ```ts
   * const chat = await client.chats.retrieve(
   *   '!NCdzlIaMjZUmvmvyHU:beeper.com',
   * );
   * ```
   */
  retrieve(
    chatID: string,
    query: ChatRetrieveParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<Chat> {
    return this._client.get(path`/v1/chats/${chatID}`, { query, ...options });
  }

  /**
   * Update supported chat fields. Non-empty drafts are accepted only when the
   * current draft is empty. Send draft=null to clear the draft before setting new
   * draft text or attachments.
   *
   * @example
   * ```ts
   * const chat = await client.chats.update(
   *   '!NCdzlIaMjZUmvmvyHU:beeper.com',
   * );
   * ```
   */
  update(
    chatID: string,
    body: ChatUpdateParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<Chat> {
    return this._client.patch(path`/v1/chats/${chatID}`, { body, ...options });
  }

  /**
   * List all chats sorted by last activity (most recent first). Combines all
   * accounts into a single paginated list.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const chatListResponse of client.chats.list()) {
   *   // ...
   * }
   * ```
   */
  list(
    query: ChatListParams | null | undefined = {},
    options?: RequestOptions,
  ): PagePromise<ChatListResponsesCursorNoLimit, ChatListResponse> {
    return this._client.getAPIList('/v1/chats', CursorNoLimit<ChatListResponse>, { query, ...options });
  }

  /**
   * Archive or unarchive a chat. Set archived=true to move it to Archive, or
   * archived=false to move it back to the inbox.
   *
   * @example
   * ```ts
   * await client.chats.archive(
   *   '!NCdzlIaMjZUmvmvyHU:beeper.com',
   * );
   * ```
   */
  archive(
    chatID: string,
    body: ChatArchiveParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<void> {
    return this._client.post(path`/v1/chats/${chatID}/archive`, {
      body,
      ...options,
      headers: buildHeaders([{ Accept: '*/*' }, options?.headers]),
    });
  }

  /**
   * Mark a chat as read, optionally through a specific message ID.
   *
   * @example
   * ```ts
   * const chat = await client.chats.markRead(
   *   '!NCdzlIaMjZUmvmvyHU:beeper.com',
   * );
   * ```
   */
  markRead(
    chatID: string,
    body: ChatMarkReadParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<Chat> {
    return this._client.post(path`/v1/chats/${chatID}/read`, { body, ...options });
  }

  /**
   * Mark a chat as unread, optionally from a specific message ID.
   *
   * @example
   * ```ts
   * const chat = await client.chats.markUnread(
   *   '!NCdzlIaMjZUmvmvyHU:beeper.com',
   * );
   * ```
   */
  markUnread(
    chatID: string,
    body: ChatMarkUnreadParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<Chat> {
    return this._client.post(path`/v1/chats/${chatID}/unread`, { body, ...options });
  }

  /**
   * Send a notification despite the recipient focus state when the network supports
   * it. Currently intended for iMessage on macOS; unsupported networks return an
   * error.
   *
   * @example
   * ```ts
   * const chat = await client.chats.notifyAnyway(
   *   '!NCdzlIaMjZUmvmvyHU:beeper.com',
   * );
   * ```
   */
  notifyAnyway(
    chatID: string,
    body?: ChatNotifyAnywayParams | null | undefined,
    options?: RequestOptions,
  ): APIPromise<Chat> {
    return this._client.post(path`/v1/chats/${chatID}/notify-anyway`, { body, ...options });
  }

  /**
   * Search chats by title, network, or participant names.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const chat of client.chats.search()) {
   *   // ...
   * }
   * ```
   */
  search(
    query: ChatSearchParams | null | undefined = {},
    options?: RequestOptions,
  ): PagePromise<ChatsCursorSearch, Chat> {
    return this._client.getAPIList('/v1/chats/search', CursorSearch<Chat>, { query, ...options });
  }

  /**
   * Resolve a user/contact and open a direct chat. Reuses and returns an existing
   * direct chat when one is found. Available in Beeper v4.2.808+.
   *
   * @example
   * ```ts
   * const response = await client.chats.start({
   *   accountID: 'accountID',
   *   user: {},
   * });
   * ```
   */
  start(body: ChatStartParams, options?: RequestOptions): APIPromise<ChatStartResponse> {
    return this._client.post('/v1/chats/start', { body, ...options });
  }
}
/**
 * Manage chats
 */
export class Chats extends BaseChats {
  reminders: RemindersAPI.Reminders = new RemindersAPI.Reminders(this._client);
  messages: MessagesAPI.Messages = new MessagesAPI.Messages(this._client);
}

export type ChatListResponsesCursorNoLimit = CursorNoLimit<ChatListResponse>;

export type ChatsCursorSearch = CursorSearch<Chat>;

export interface Chat {
  /**
   * Unique identifier of the chat across Beeper.
   */
  id: string;

  /**
   * Account ID this chat belongs to.
   */
  accountID: string;

  /**
   * Display-only human-readable account/network name.
   */
  network: string;

  /**
   * Chat participants information.
   */
  participants: Chat.Participants;

  /**
   * Display title of the chat as computed by the client/server.
   */
  title: string;

  /**
   * Chat type: 'single' for direct messages, 'group' for group chats.
   */
  type: 'single' | 'group';

  /**
   * Number of unread messages.
   */
  unreadCount: number;

  /**
   * Chat capabilities reported by the platform.
   */
  capabilities?: Shared.ChatCapabilities;

  /**
   * Group chat description/topic when available.
   */
  description?: string | null;

  /**
   * Current draft object for this chat, or null when no draft is set.
   */
  draft?: Shared.ChatDraft | null;

  /**
   * Local filesystem path to the chat avatar image when available.
   */
  imgURL?: string | null;

  /**
   * True if chat is archived.
   */
  isArchived?: boolean;

  /**
   * True if chat is marked low priority.
   */
  isLowPriority?: boolean;

  /**
   * True if the chat was explicitly marked unread by the authenticated user.
   */
  isMarkedUnread?: boolean;

  /**
   * True if chat notifications are muted.
   */
  isMuted?: boolean;

  /**
   * True if chat is pinned.
   */
  isPinned?: boolean;

  /**
   * True if messages cannot be sent in this chat.
   */
  isReadOnly?: boolean;

  /**
   * Timestamp of last activity.
   */
  lastActivity?: string;

  /**
   * Last read message sortKey.
   */
  lastReadMessageSortKey?: string;

  /**
   * Local chat ID specific to this installation.
   */
  localChatID?: string | null;

  /**
   * Disappearing-message timer in seconds when available.
   */
  messageExpirySeconds?: number | null;

  /**
   * Current reminder for this chat, or null when no reminder is set.
   */
  reminder?: Chat.Reminder | null;

  /**
   * Current snooze state for this chat, or null when no snooze is set.
   */
  snooze?: Chat.Snooze | null;

  /**
   * Number of unread messages that mention the authenticated user or @room.
   */
  unreadMentionsCount?: number;
}

export namespace Chat {
  /**
   * Chat participants information.
   */
  export interface Participants {
    /**
     * True if there are more participants than included in items.
     */
    hasMore: boolean;

    /**
     * Participants returned for this chat (limited by the request; may be a subset).
     */
    items: Array<Participants.Item>;

    /**
     * Total number of participants in the chat.
     */
    total: number;
  }

  export namespace Participants {
    /**
     * A chat participant. Extends User with chat membership metadata.
     */
    export interface Item extends Shared.User {
      /**
       * True if this participant has admin privileges in the chat.
       */
      isAdmin?: boolean;

      /**
       * True if this participant represents an automated network account.
       */
      isNetworkBot?: boolean;

      /**
       * True if this participant has been invited but has not joined yet.
       */
      isPending?: boolean;
    }
  }

  /**
   * Current reminder for this chat, or null when no reminder is set.
   */
  export interface Reminder {
    /**
     * Cancel reminder if someone messages in the chat.
     */
    dismissOnIncomingMessage?: boolean;

    /**
     * Timestamp when the reminder should trigger.
     */
    remindAt?: string;
  }

  /**
   * Current snooze state for this chat, or null when no snooze is set.
   */
  export interface Snooze {
    /**
     * Timestamp when the snooze expires.
     */
    snoozeUntil?: string;

    /**
     * Timestamp when the user set the snooze.
     */
    userSnoozedAt?: string;
  }
}

export interface ChatCreateResponse extends Chat {
  /**
   * @deprecated Use id instead.
   */
  chatID: string;

  /**
   * @deprecated Inspect the returned Chat instead.
   */
  status?: 'existing' | 'created';
}

/**
 * Chat with optional last message preview.
 */
export interface ChatListResponse extends Chat {
  /**
   * Last message preview for this chat, if available.
   */
  preview?: Shared.Message;
}

export interface ChatStartResponse extends Chat {
  /**
   * @deprecated Use id instead.
   */
  chatID: string;

  /**
   * @deprecated Inspect the returned Chat instead.
   */
  status?: 'existing' | 'created';
}

export interface ChatCreateParams {
  /**
   * Account to create or start the chat on.
   */
  accountID: string;

  /**
   * User IDs to include in the new chat.
   */
  participantIDs: Array<string>;

  /**
   * 'single' requires exactly one participantID; 'group' supports multiple
   * participants and optional title.
   */
  type: 'single' | 'group';

  /**
   * Optional first message content if the platform requires it to create the chat.
   */
  messageText?: string;

  /**
   * Optional title for group chats; ignored for single chats on most networks.
   */
  title?: string;
}

export interface ChatRetrieveParams {
  /**
   * Maximum number of participants to return. Use -1 for all; otherwise 0-500.
   * Defaults to 100. List and search endpoints return up to 20 participants per
   * chat.
   */
  maxParticipantCount?: number | null;
}

export interface ChatUpdateParams {
  /**
   * Group chat description/topic. Support depends on the chat account and chat
   * permissions.
   */
  description?: string | null;

  /**
   * Draft object to set or clear. Non-empty drafts are only accepted when the
   * current draft is empty. Send draft=null to clear text and attachments together
   * before setting a new draft.
   */
  draft?: ChatUpdateParams.Draft | null;

  /**
   * Local filesystem path to a group chat avatar image. Support depends on the chat
   * account and chat permissions.
   */
  imgURL?: string | null;

  /**
   * Archive or unarchive the chat.
   */
  isArchived?: boolean;

  /**
   * Mark or unmark the chat as low priority when supported by the account.
   */
  isLowPriority?: boolean;

  /**
   * Mute or unmute the chat.
   */
  isMuted?: boolean;

  /**
   * Pin or unpin the chat when supported by the account.
   */
  isPinned?: boolean;

  /**
   * Disappearing-message timer in seconds, or null to clear when supported.
   */
  messageExpirySeconds?: number | null;

  /**
   * Custom chat title. Support depends on the chat account and chat permissions.
   */
  title?: string | null;
}

export namespace ChatUpdateParams {
  /**
   * Draft object to set or clear. Non-empty drafts are only accepted when the
   * current draft is empty. Send draft=null to clear text and attachments together
   * before setting a new draft.
   */
  export interface Draft {
    /**
     * Draft text. Plain text and Markdown are converted to Beeper rich text with the
     * same rules used by send and edit.
     */
    text: string;

    /**
     * Draft attachments keyed by attachment ID. Each attachment must reference an
     * uploadID returned by the upload file endpoint.
     */
    attachments?: { [key: string]: Draft.Attachments };
  }

  export namespace Draft {
    export interface Attachments {
      /**
       * Upload ID from uploadAsset endpoint. Required to reference uploaded files.
       */
      uploadID: string;

      /**
       * Optional draft attachment identifier. If omitted, a new identifier is generated.
       */
      id?: string;

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
      size?: Attachments.Size;

      /**
       * Attachment type hint (image, video, audio, file, gif, voice-note, sticker). If
       * omitted, auto-detected from mimeType
       */
      type?: 'image' | 'video' | 'audio' | 'file' | 'gif' | 'voice-note' | 'sticker';
    }

    export namespace Attachments {
      /**
       * Dimensions (optional override of cached value)
       */
      export interface Size {
        height: number;

        width: number;
      }
    }
  }
}

export interface ChatListParams extends CursorNoLimitParams {
  /**
   * Limit to specific account IDs. If omitted, fetches from all accounts.
   */
  accountIDs?: Array<string>;
}

export interface ChatArchiveParams {
  /**
   * True to archive, false to unarchive
   */
  archived?: boolean;
}

export interface ChatMarkReadParams {
  /**
   * Optional message ID to mark read through.
   */
  messageID?: string;
}

export interface ChatMarkUnreadParams {
  /**
   * Optional message ID to mark unread from.
   */
  messageID?: string;
}

export interface ChatNotifyAnywayParams {}

export interface ChatSearchParams extends CursorSearchParams {
  /**
   * Limit results to specific chat accounts.
   */
  accountIDs?: Array<string>;

  /**
   * Filter by inbox type: "primary" (non-archived, non-low-priority),
   * "low-priority", or "archive". If not specified, shows all chats.
   */
  inbox?: 'primary' | 'low-priority' | 'archive';

  /**
   * Include chats marked as Muted by the user, which are usually less important.
   * Default: true. Set to false if the user wants a more refined search.
   */
  includeMuted?: boolean | null;

  /**
   * Only include chats with last activity after this ISO 8601 datetime.
   */
  lastActivityAfter?: string;

  /**
   * Only include chats with last activity before this ISO 8601 datetime.
   */
  lastActivityBefore?: string;

  /**
   * Literal chat search. Use words the user typed, such as "dinner". When multiple
   * words are provided, all must match. Case-insensitive.
   */
  query?: string;

  /**
   * Search scope: 'titles' matches title + network; 'participants' matches
   * participant names.
   */
  scope?: 'titles' | 'participants';

  /**
   * Specify the type of chats to retrieve: use "single" for direct messages, "group"
   * for group chats, or "any" to get all types
   */
  type?: 'single' | 'group' | 'any';

  /**
   * Set to true to only retrieve chats that have unread messages
   */
  unreadOnly?: boolean | null;
}

export interface ChatStartParams {
  /**
   * Account to create or start the chat on.
   */
  accountID: string;

  /**
   * Contact-like user payload used to resolve the best identifier.
   */
  user: ChatStartParams.User;

  /**
   * Whether invite-based DM creation is allowed when required by the platform.
   */
  allowInvite?: boolean;

  /**
   * Optional first message content if the platform requires it to create the chat.
   */
  messageText?: string;
}

export namespace ChatStartParams {
  /**
   * Contact-like user payload used to resolve the best identifier.
   */
  export interface User {
    /**
     * Known user ID when available.
     */
    id?: string;

    /**
     * Email candidate.
     */
    email?: string;

    /**
     * Display name hint used for ranking only.
     */
    fullName?: string;

    /**
     * Phone number candidate (E.164 preferred).
     */
    phoneNumber?: string;

    /**
     * Username/handle candidate.
     */
    username?: string;
  }
}

Chats.Reminders = Reminders;
Chats.BaseReminders = BaseReminders;
Chats.Messages = Messages;
Chats.BaseMessages = BaseMessages;

export declare namespace Chats {
  export {
    type Chat as Chat,
    type ChatCreateResponse as ChatCreateResponse,
    type ChatListResponse as ChatListResponse,
    type ChatStartResponse as ChatStartResponse,
    type ChatListResponsesCursorNoLimit as ChatListResponsesCursorNoLimit,
    type ChatsCursorSearch as ChatsCursorSearch,
    type ChatCreateParams as ChatCreateParams,
    type ChatRetrieveParams as ChatRetrieveParams,
    type ChatUpdateParams as ChatUpdateParams,
    type ChatListParams as ChatListParams,
    type ChatArchiveParams as ChatArchiveParams,
    type ChatMarkReadParams as ChatMarkReadParams,
    type ChatMarkUnreadParams as ChatMarkUnreadParams,
    type ChatNotifyAnywayParams as ChatNotifyAnywayParams,
    type ChatSearchParams as ChatSearchParams,
    type ChatStartParams as ChatStartParams,
  };

  export {
    Reminders as Reminders,
    BaseReminders as BaseReminders,
    type ReminderCreateParams as ReminderCreateParams,
  };

  export { Messages as Messages, BaseMessages as BaseMessages };
}
