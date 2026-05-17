export const apiCopy = {
  accounts: {
    list: 'List chat accounts connected to this Beeper Client API server, including bridge, network, user identity, and connection status.',
  },
  assets: {
    download: 'Download a file from an mxc:// or localmxc:// URL to the device running the Beeper Client API and return the local file URL.',
    upload: 'Upload a file to a temporary location using multipart/form-data. Returns an uploadID that can be referenced when sending a message or creating a draft attachment.',
  },
  chats: {
    archive: 'Archive or unarchive a chat. Set archived=true to move it to Archive, or archived=false to move it back to the inbox.',
    create: 'Create a direct or group chat from participant IDs. Returns the created chat.',
    list: 'List all chats sorted by last activity (most recent first). Combines all accounts into a single paginated list.',
    markRead: 'Mark a chat as read, optionally through a specific message ID.',
    markUnread: 'Mark a chat as unread, optionally from a specific message ID.',
    notifyAnyway: 'Send a notification despite the recipient focus state when the network supports it. Currently intended for iMessage on macOS; unsupported networks return an error.',
    retrieve: 'Retrieve chat details, including metadata, participants, and the latest message.',
    search: 'Search chats by title, network, or participant names.',
    start: 'Resolve a user/contact and open a direct chat. Reuses and returns an existing direct chat when one is found. Available in Beeper v4.2.808+.',
  },
  contacts: {
    list: 'List merged contacts for a specific account with cursor-based pagination.',
    search: 'Search contacts on a specific account using merged account contacts, network search, and exact identifier lookup.',
  },
  messages: {
    delete: 'Delete a message by final message ID. Pending message IDs are not accepted because messages cannot be deleted while sending.',
    list: 'List all messages in a chat with cursor-based pagination. Sorted by timestamp.',
    retrieve: 'Retrieve a message by final message ID, pendingMessageID, or Matrix event ID. chatID may be a Beeper chat ID or a local chat ID.',
    search: 'Search messages across chats.',
    send: 'Send a text message to a specific chat. Supports replying to existing messages. Returns a pending message ID.',
    update: 'Edit the text content of an existing message. Messages with attachments cannot be edited.',
  },
  reactions: {
    add: 'Add a reaction to an existing message.',
    delete: 'Remove the reaction added by the authenticated user from an existing message.',
  },
  reminders: {
    create: 'Set a reminder for a chat at a specific time.',
    delete: 'Clear an existing reminder from a chat.',
  },
} as const

export const sdkParamCopy = {
  attachmentFile: 'The file to upload (max 500 MB).',
  chatID: 'Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available.',
  fileName: 'Original filename. Defaults to the uploaded file name if omitted',
  forEveryone: 'True to request deletion for everyone when the network supports it; false to delete only for the authenticated user when supported.',
  messageID: 'Message ID.',
  mimeType: 'MIME type. Auto-detected from magic bytes if omitted',
  reactionKey: 'Reaction key to add (emoji, shortcode, or custom emoji key)',
  remindAt: 'Timestamp when the reminder should trigger.',
  replyToMessageID: 'Provide a message ID to send this as a reply to an existing message',
  searchQuery: 'User-typed search text. Literal word matching (non-semantic).',
  text: 'Draft text. Plain text and Markdown are converted to Matrix HTML with the same rules used by send and edit.',
} as const

export const cliCopy = {
  args: {
    accountSelector: 'Account ID, network, bridge, or account user',
    chatSelector: `${sdkParamCopy.chatID} Also accepts exact chat titles or search text.`,
  },
  flags: {
    baseURL: 'Beeper Desktop API base URL',
    json: 'Print JSON',
    pick: 'Pick the Nth chat when the input is ambiguous',
  },
} as const
