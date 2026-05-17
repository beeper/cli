// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { CursorNoLimit, CursorSearch } from '../core/pagination';

export interface APIError {
  code: string;

  message: string;

  details?: { [key: string]: unknown };
}

export interface AppStateSnapshot {
  /**
   * Encrypted messaging setup status.
   */
  e2ee: AppStateSnapshot.E2EE;

  /**
   * Current sign-in and encrypted messaging setup state for Beeper Desktop or Beeper
   * Server.
   */
  state:
    | 'needs-login'
    | 'initializing'
    | 'needs-cross-signing-setup'
    | 'needs-verification'
    | 'needs-secrets'
    | 'needs-first-sync'
    | 'ready';

  /**
   * Signed-in account details. Omitted until sign-in is complete.
   */
  matrix?: AppStateSnapshot.Matrix;

  /**
   * Trusted device verification progress.
   */
  verification?: AppStateSnapshot.Verification;
}

export namespace AppStateSnapshot {
  /**
   * Encrypted messaging setup status.
   */
  export interface E2EE {
    /**
     * Whether this account can verify trusted devices.
     */
    crossSigning: boolean;

    /**
     * Whether the first encrypted message sync is complete.
     */
    firstSyncDone: boolean;

    /**
     * Whether the user confirmed that they saved their recovery key.
     */
    hasBackedUpRecoveryKey: boolean;

    /**
     * Whether encrypted messaging setup has started.
     */
    initialized: boolean;

    /**
     * Whether encrypted message backup is available.
     */
    keyBackup: boolean;

    /**
     * Encrypted messaging keys available on this device.
     */
    secrets: E2EE.Secrets;

    /**
     * Whether secure key storage is available.
     */
    secretStorage: boolean;

    /**
     * Whether this device is trusted for encrypted messages.
     */
    verified: boolean;

    /**
     * Unix timestamp for when the recovery key was created.
     */
    recoveryKeyGeneratedAt?: number;
  }

  export namespace E2EE {
    /**
     * Encrypted messaging keys available on this device.
     */
    export interface Secrets {
      /**
       * Whether the account identity key is available.
       */
      masterKey: boolean;

      /**
       * Whether the encrypted message backup key is available.
       */
      megolmBackupKey: boolean;

      /**
       * Whether a recovery key is available.
       */
      recoveryKey: boolean;

      /**
       * Whether the device trust key is available.
       */
      selfSigningKey: boolean;

      /**
       * Whether the user trust key is available.
       */
      userSigningKey: boolean;
    }
  }

  /**
   * Signed-in account details. Omitted until sign-in is complete.
   */
  export interface Matrix {
    /**
     * Current device ID.
     */
    deviceID: string;

    /**
     * Beeper homeserver URL for this account.
     */
    homeserver: string;

    /**
     * Signed-in Beeper user ID.
     */
    userID: string;
  }

  /**
   * Trusted device verification progress.
   */
  export interface Verification {
    /**
     * Verification ID to pass in verification action paths.
     */
    id: string;

    /**
     * Verification actions that are valid for the current state.
     */
    availableActions: Array<'accept' | 'cancel' | 'qr.confirmScanned' | 'sas.start' | 'sas.confirm'>;

    /**
     * Whether this device started or received the verification.
     */
    direction: 'incoming' | 'outgoing';

    /**
     * Verification methods supported for this transaction.
     */
    methods: Array<'qr' | 'sas'>;

    /**
     * Why this verification exists.
     */
    purpose: 'login' | 'device';

    /**
     * Current trusted-device verification state.
     */
    state: 'requested' | 'ready' | 'sas_ready' | 'qr_scanned' | 'done' | 'cancelled' | 'error';

    /**
     * Verification error details, if verification stopped.
     */
    error?: Verification.Error;

    /**
     * Other device participating in verification.
     */
    otherDevice?: Verification.OtherDevice;

    /**
     * Other Beeper user participating in verification.
     */
    otherUserID?: string;

    /**
     * QR verification data.
     */
    qr?: Verification.QR;

    /**
     * Emoji or number comparison data for verification.
     */
    sas?: Verification.SAS;
  }

  export namespace Verification {
    /**
     * Verification error details, if verification stopped.
     */
    export interface Error {
      /**
       * Verification error code.
       */
      code: string;

      /**
       * User-facing verification error message.
       */
      reason: string;
    }

    /**
     * Other device participating in verification.
     */
    export interface OtherDevice {
      /**
       * Other device ID.
       */
      id: string;

      /**
       * Other device display name, if known.
       */
      name?: string;
    }

    /**
     * QR verification data.
     */
    export interface QR {
      /**
       * QR code payload to display for verification.
       */
      data: string;
    }

    /**
     * Emoji or number comparison data for verification.
     */
    export interface SAS {
      /**
       * Emoji sequence to compare on both devices.
       */
      emojis: string;

      /**
       * Number sequence to compare on both devices.
       */
      decimals?: string;
    }
  }
}

export interface Attachment {
  /**
   * Attachment type.
   */
  type: 'unknown' | 'img' | 'video' | 'audio';

  /**
   * Attachment identifier, typically an mxc:// URL. Use the download file endpoint
   * to get a local file path.
   */
  id?: string;

  /**
   * Duration in seconds (audio/video).
   */
  duration?: number;

  /**
   * Original filename if available.
   */
  fileName?: string;

  /**
   * File size in bytes if known.
   */
  fileSize?: number;

  /**
   * True if the attachment is a GIF.
   */
  isGif?: boolean;

  /**
   * True if the attachment is a sticker.
   */
  isSticker?: boolean;

  /**
   * True if the attachment is a voice note.
   */
  isVoiceNote?: boolean;

  /**
   * MIME type if known (e.g., 'image/png').
   */
  mimeType?: string;

  /**
   * Preview image URL for video attachments (poster frame). May be temporary or
   * available only on this device; download promptly if durable access is needed.
   */
  posterImg?: string;

  /**
   * Pixel dimensions of the attachment: width/height in px.
   */
  size?: Attachment.Size;

  /**
   * Public URL or local file path to fetch the file. May be temporary or available
   * only on this device; download promptly if durable access is needed.
   */
  srcURL?: string;

  /**
   * Attachment transcription if available.
   */
  transcription?: Attachment.Transcription;
}

export namespace Attachment {
  /**
   * Pixel dimensions of the attachment: width/height in px.
   */
  export interface Size {
    height?: number;

    width?: number;
  }

  /**
   * Attachment transcription if available.
   */
  export interface Transcription {
    /**
     * Transcription engine.
     */
    engine: string;

    /**
     * Transcribed text.
     */
    transcription: string;

    /**
     * Detected or selected language.
     */
    language?: string;
  }
}

/**
 * Capabilities for one attachment message type.
 */
export interface AttachmentCapabilities {
  /**
   * Supported MIME types or MIME patterns for this file message type. Missing MIME
   * types should be treated as rejected.
   */
  mimeTypes: { [key: string]: -2 | -1 | 0 | 1 | 2 };

  /**
   * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
   * supported.
   */
  caption?: -2 | -1 | 0 | 1 | 2;

  /**
   * Maximum caption length when captions are supported.
   */
  maxCaptionLength?: number;

  /**
   * Maximum audio or video duration in seconds.
   */
  maxDuration?: number;

  /**
   * Maximum image or video height in pixels.
   */
  maxHeight?: number;

  /**
   * Maximum file size in bytes.
   */
  maxSize?: number;

  /**
   * Maximum image or video width in pixels.
   */
  maxWidth?: number;

  /**
   * True if this file type can be sent as view-once media.
   */
  viewOnce?: boolean;
}

/**
 * Chat capabilities reported by the platform.
 */
export interface ChatCapabilities {
  /**
   * Allowed Unicode reactions. Omitted means all emoji reactions are allowed.
   */
  allowedReactions?: Array<string>;

  /**
   * True if archive/unarchive is supported.
   */
  archive?: boolean;

  /**
   * Supported attachment message types and their per-type constraints, keyed by
   * Matrix msgtype or pseudo-msgtype (for example m.image, m.video,
   * org.matrix.msc3245.voice). Missing message types should be treated as rejected.
   */
  attachments?: { [key: string]: AttachmentCapabilities };

  /**
   * True if custom emoji reactions are supported.
   */
  customEmojiReactions?: boolean;

  /**
   * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
   * supported.
   */
  delete?: -2 | -1 | 0 | 1 | 2;

  /**
   * True if deleting chats for the authenticated user is supported.
   */
  deleteChat?: boolean;

  /**
   * True if deleting chats for everyone is supported.
   */
  deleteChatForEveryone?: boolean;

  /**
   * True if deleting messages only for the authenticated user is supported.
   */
  deleteForMe?: boolean;

  /**
   * Maximum message age for delete-for-everyone, in seconds.
   */
  deleteMaxAge?: number;

  /**
   * Disappearing-message timer capabilities.
   */
  disappearingTimer?: ChatCapabilities.DisappearingTimer;

  /**
   * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
   * supported.
   */
  edit?: -2 | -1 | 0 | 1 | 2;

  /**
   * Maximum message age for edits, in seconds.
   */
  editMaxAge?: number;

  /**
   * Maximum number of edits allowed for one message.
   */
  editMaxCount?: number;

  /**
   * Supported rich-text formatting features keyed by feature name (for example bold,
   * inline_code, code_block.syntax_highlighting). Omitted means no formatting
   * support is advertised.
   */
  formatting?: { [key: string]: -2 | -1 | 0 | 1 | 2 };

  /**
   * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
   * supported.
   */
  locationMessage?: -2 | -1 | 0 | 1 | 2;

  /**
   * True if marking chats unread is supported.
   */
  markAsUnread?: boolean;

  /**
   * Maximum length of normal text messages.
   */
  maxTextLength?: number;

  /**
   * Message request capabilities.
   */
  messageRequest?: ChatCapabilities.MessageRequest;

  /**
   * Participant management capabilities.
   */
  participantActions?: ChatCapabilities.ParticipantActions;

  /**
   * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
   * supported.
   */
  poll?: -2 | -1 | 0 | 1 | 2;

  /**
   * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
   * supported.
   */
  reaction?: -2 | -1 | 0 | 1 | 2;

  /**
   * Maximum number of reactions allowed on a single message.
   */
  reactionCount?: number;

  /**
   * True if read receipts are supported.
   */
  readReceipts?: boolean;

  /**
   * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
   * supported.
   */
  reply?: -2 | -1 | 0 | 1 | 2;

  /**
   * Chat state update capabilities.
   */
  state?: ChatStateCapabilities;

  /**
   * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
   * supported.
   */
  thread?: -2 | -1 | 0 | 1 | 2;

  /**
   * True if typing notifications are supported.
   */
  typingNotifications?: boolean;
}

export namespace ChatCapabilities {
  /**
   * Disappearing-message timer capabilities.
   */
  export interface DisappearingTimer {
    /**
     * True if empty timer objects should be omitted from message content.
     */
    omitEmptyTimer?: boolean;

    /**
     * Allowed disappearing timer values in milliseconds. Omitted means any timer is
     * allowed.
     */
    timers?: Array<number>;

    /**
     * Supported disappearing timer types.
     */
    types?: Array<'afterRead' | 'afterSend'>;
  }

  /**
   * Message request capabilities.
   */
  export interface MessageRequest {
    /**
     * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
     * supported.
     */
    acceptWithButton?: -2 | -1 | 0 | 1 | 2;

    /**
     * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
     * supported.
     */
    acceptWithMessage?: -2 | -1 | 0 | 1 | 2;
  }

  /**
   * Participant management capabilities.
   */
  export interface ParticipantActions {
    /**
     * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
     * supported.
     */
    ban?: -2 | -1 | 0 | 1 | 2;

    /**
     * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
     * supported.
     */
    invite?: -2 | -1 | 0 | 1 | 2;

    /**
     * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
     * supported.
     */
    kick?: -2 | -1 | 0 | 1 | 2;

    /**
     * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
     * supported.
     */
    leave?: -2 | -1 | 0 | 1 | 2;

    /**
     * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
     * supported.
     */
    revokeInvite?: -2 | -1 | 0 | 1 | 2;
  }
}

/**
 * Current draft object for this chat, or null when no draft is set.
 */
export interface ChatDraft {
  /**
   * Rich-text draft body as returned by Beeper.
   */
  text: string;

  /**
   * Draft attachments keyed by attachment ID.
   */
  attachments?: { [key: string]: DraftAttachment };
}

/**
 * Chat state update capabilities.
 */
export interface ChatStateCapabilities {
  /**
   * Chat avatar state capability.
   */
  avatar?: ChatStateCapabilities.Avatar;

  /**
   * Chat description/topic state capability.
   */
  description?: ChatStateCapabilities.Description;

  /**
   * Disappearing-message timer state capability.
   */
  disappearingTimer?: ChatStateCapabilities.DisappearingTimer;

  /**
   * Chat title state capability.
   */
  title?: ChatStateCapabilities.Title;
}

export namespace ChatStateCapabilities {
  /**
   * Chat avatar state capability.
   */
  export interface Avatar {
    /**
     * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
     * supported.
     */
    level: -2 | -1 | 0 | 1 | 2;
  }

  /**
   * Chat description/topic state capability.
   */
  export interface Description {
    /**
     * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
     * supported.
     */
    level: -2 | -1 | 0 | 1 | 2;
  }

  /**
   * Disappearing-message timer state capability.
   */
  export interface DisappearingTimer {
    /**
     * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
     * supported.
     */
    level: -2 | -1 | 0 | 1 | 2;
  }

  /**
   * Chat title state capability.
   */
  export interface Title {
    /**
     * -2: rejected, -1: dropped, 0: unsupported, 1: partially supported, 2: fully
     * supported.
     */
    level: -2 | -1 | 0 | 1 | 2;
  }
}

export interface DraftAttachment {
  /**
   * Draft attachment identifier.
   */
  id: string;

  /**
   * Draft attachment type. GIF and recorded audio are mutually exclusive types.
   */
  type: 'file' | 'gif' | 'recorded_audio';

  /**
   * Audio duration in seconds if known.
   */
  audioDurationSeconds?: number;

  /**
   * Original filename if available.
   */
  fileName?: string;

  /**
   * Local filesystem path for the draft attachment.
   */
  filePath?: string;

  /**
   * File size in bytes if known.
   */
  fileSize?: number;

  /**
   * MIME type if known.
   */
  mimeType?: string;

  /**
   * Pixel dimensions of the attachment.
   */
  size?: DraftAttachment.Size;

  /**
   * Sticker identifier if the draft attachment is a sticker.
   */
  stickerID?: string;
}

export namespace DraftAttachment {
  /**
   * Pixel dimensions of the attachment.
   */
  export interface Size {
    height?: number;

    width?: number;
  }
}

export interface Error {
  /**
   * Machine-readable error code
   */
  code: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Additional error details for debugging
   */
  details?: Error.ValidationDetails | { [key: string]: unknown } | unknown;
}

export namespace Error {
  /**
   * Validation error details
   */
  export interface ValidationDetails {
    /**
     * List of validation issues
     */
    issues: Array<ValidationDetails.Issue>;
  }

  export namespace ValidationDetails {
    export interface Issue {
      /**
       * Validation issue code
       */
      code: string;

      /**
       * Human-readable description of the validation issue
       */
      message: string;

      /**
       * Path pointing to the invalid field within the payload
       */
      path: Array<string | number>;
    }
  }
}

/**
 * Link preview included with a message.
 */
export interface LinkPreview {
  /**
   * Link preview title.
   */
  title: string;

  /**
   * Resolved link URL.
   */
  url: string;

  /**
   * Favicon URL if available. May be temporary or available only on this device;
   * download promptly if durable access is needed.
   */
  favicon?: string;

  /**
   * Preview image URL if available. May be temporary or available only on this
   * device; download promptly if durable access is needed.
   */
  img?: string;

  /**
   * Preview image dimensions.
   */
  imgSize?: LinkPreview.ImgSize;

  /**
   * Original URL when the displayed URL is shortened or redirected.
   */
  originalURL?: string;

  /**
   * Link preview summary.
   */
  summary?: string;
}

export namespace LinkPreview {
  /**
   * Preview image dimensions.
   */
  export interface ImgSize {
    height?: number;

    width?: number;
  }
}

export interface Message {
  /**
   * Message ID.
   */
  id: string;

  /**
   * Beeper account ID the message belongs to.
   */
  accountID: string;

  /**
   * Chat ID. Input routes also accept the local chat ID from this installation when
   * available.
   */
  chatID: string;

  /**
   * Fully qualified sender user ID. Network-backed IDs usually include the network
   * prefix and homeserver.
   */
  senderID: string;

  /**
   * A unique, sortable key used to sort messages.
   */
  sortKey: string;

  /**
   * Message timestamp.
   */
  timestamp: string;

  /**
   * Attachments included with this message, if any.
   */
  attachments?: Array<Attachment>;

  /**
   * Timestamp when the message was edited, if known.
   */
  editedTimestamp?: string;

  /**
   * True if the message has been deleted.
   */
  isDeleted?: boolean;

  /**
   * True if the message is hidden from normal display.
   */
  isHidden?: boolean;

  /**
   * True if the authenticated user sent the message.
   */
  isSender?: boolean;

  /**
   * True if the message is unread for the authenticated user. May be omitted.
   */
  isUnread?: boolean;

  /**
   * ID of the message this is a reply to, if any.
   */
  linkedMessageID?: string;

  /**
   * Link previews included with this message, if any.
   */
  links?: Array<LinkPreview>;

  /**
   * Mentioned user IDs, @room, or null for legacy messages that require text
   * scanning.
   */
  mentions?: Array<string> | null;

  /**
   * Reactions to the message, if any.
   */
  reactions?: Array<Reaction>;

  /**
   * Read receipt state for this message, when available.
   */
  seen?: boolean | string | { [key: string]: boolean | string };

  /**
   * Resolved sender display name.
   */
  senderName?: string;

  /**
   * Message send status for this message, when reported by the bridge.
   */
  sendStatus?: SendStatus;

  /**
   * Rich-text message body if present.
   */
  text?: string;

  /**
   * Message content type. Useful for distinguishing reactions, media messages, and
   * state events from regular text messages.
   */
  type?:
    | 'TEXT'
    | 'NOTICE'
    | 'IMAGE'
    | 'VIDEO'
    | 'VOICE'
    | 'AUDIO'
    | 'FILE'
    | 'STICKER'
    | 'LOCATION'
    | 'REACTION';
}

export interface Reaction {
  /**
   * Reaction ID. When a participant can react more than once, the ID is the
   * participant ID concatenated with the reaction key; otherwise it equals the
   * participant ID.
   */
  id: string;

  /**
   * User ID of the participant who reacted.
   */
  participantID: string;

  /**
   * The reaction key: an emoji (😄), a network-specific key, or a shortcode like
   * "smiling-face".
   */
  reactionKey: string;

  /**
   * True if the reactionKey is an emoji.
   */
  emoji?: boolean;

  /**
   * URL to the reaction's image. May be temporary or available only on this device;
   * download promptly if durable access is needed.
   */
  imgURL?: string;
}

/**
 * Message send status for this message, when reported by the bridge.
 */
export interface SendStatus {
  /**
   * Current status of the message send attempt.
   */
  status: 'SUCCESS' | 'PENDING' | 'FAIL_RETRIABLE' | 'FAIL_PERMANENT';

  /**
   * Timestamp for the send status event.
   */
  timestamp: string;

  /**
   * User IDs the message was delivered to, when reported by the network.
   */
  deliveredToUsers?: Array<string>;

  /**
   * Diagnostic error detail from the messaging network adapter. Do not show directly
   * to users.
   */
  internalError?: string;

  /**
   * Human-readable send status or failure message.
   */
  message?: string;

  /**
   * Machine-readable failure reason. Present when the send status is a failure.
   */
  reason?: string;
}

/**
 * User the account belongs to.
 */
export interface User {
  /**
   * Stable Beeper user ID. Use as the primary key when referencing a person.
   */
  id: string;

  /**
   * True if Beeper cannot initiate messages to this user (e.g., blocked, network
   * restriction, or no DM path). The user may still message you.
   */
  cannotMessage?: boolean;

  /**
   * Email address if known. Not guaranteed verified.
   */
  email?: string;

  /**
   * Display name as shown in clients (e.g., 'Alice Example'). May include emojis.
   */
  fullName?: string;

  /**
   * Avatar image URL if available. This may be a remote URL, media URL, data URL, or
   * local file URL depending on the source. May be temporary or available only on
   * this device; download promptly if durable access is needed.
   */
  imgURL?: string;

  /**
   * True if this user represents the authenticated account's own identity.
   */
  isSelf?: boolean;

  /**
   * User's phone number in E.164 format (e.g., '+14155552671'). Omit if unknown.
   */
  phoneNumber?: string;

  /**
   * Human-readable handle if available (e.g., '@alice'). May be network-specific and
   * not globally unique.
   */
  username?: string;
}

export type UsersCursorSearch = CursorSearch<User>;

export type MessagesCursorNoLimit = CursorNoLimit<Message>;

export type MessagesCursorSearch = CursorSearch<Message>;
