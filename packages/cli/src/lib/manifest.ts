export const commandManifest = [
  {
    "command": "setup",
    "description": "Make the selected target ready"
  },
  {
    "command": "targets list",
    "description": "List Beeper targets"
  },
  {
    "command": "targets create desktop",
    "description": "Create a managed Desktop target"
  },
  {
    "command": "targets create server",
    "description": "Create a managed Server target"
  },
  {
    "command": "targets add remote",
    "description": "Add a remote Beeper target"
  },
  {
    "command": "targets use",
    "description": "Set the default target"
  },
  {
    "command": "targets show",
    "description": "Show target details"
  },
  {
    "command": "targets status",
    "description": "Check target reachability"
  },
  {
    "command": "targets start",
    "description": "Start a managed target"
  },
  {
    "command": "targets stop",
    "description": "Stop a managed target"
  },
  {
    "command": "targets restart",
    "description": "Restart a managed target"
  },
  {
    "command": "targets logs",
    "description": "Print managed target logs"
  },
  {
    "command": "targets enable",
    "description": "Start a managed target at login"
  },
  {
    "command": "targets disable",
    "description": "Stop starting a managed target at login"
  },
  {
    "command": "targets remove",
    "description": "Remove a target"
  },
  {
    "command": "auth status",
    "description": "Show authentication state"
  },
  {
    "command": "auth logout",
    "description": "Clear stored authentication"
  },
  {
    "command": "verify",
    "description": "Continue device verification"
  },
  {
    "command": "verify status",
    "description": "Show encryption readiness"
  },
  {
    "command": "verify approve",
    "description": "Approve a verification request"
  },
  {
    "command": "verify recovery-key",
    "description": "Unlock encrypted messages with a recovery key"
  },
  {
    "command": "verify reset-recovery-key",
    "description": "Create a new recovery key"
  },
  {
    "command": "verify cancel",
    "description": "Cancel device verification"
  },
  {
    "command": "verify list",
    "description": "List active verification work"
  },
  {
    "command": "verify start",
    "description": "Start device verification"
  },
  {
    "command": "verify show",
    "description": "Show active verification details"
  },
  {
    "command": "verify sas",
    "description": "Start emoji verification"
  },
  {
    "command": "verify sas confirm",
    "description": "Confirm emoji verification"
  },
  {
    "command": "verify qr scan",
    "description": "Submit a scanned QR payload"
  },
  {
    "command": "verify qr confirm-scanned",
    "description": "Confirm a QR scan"
  },
  {
    "command": "accounts list",
    "description": "List connected accounts"
  },
  {
    "command": "accounts add",
    "description": "Add a Beeper account"
  },
  {
    "command": "accounts show",
    "description": "Show account details"
  },
  {
    "command": "accounts remove",
    "description": "Remove an account"
  },
  {
    "command": "accounts use",
    "description": "Select an account"
  },
  {
    "command": "chats list",
    "description": "List chats"
  },
  {
    "command": "chats search",
    "description": "Search chats"
  },
  {
    "command": "chats show",
    "description": "Show chat details"
  },
  {
    "command": "chats start",
    "description": "Start a chat"
  },
  {
    "command": "chats archive",
    "description": "Archive a chat"
  },
  {
    "command": "chats unarchive",
    "description": "Unarchive a chat"
  },
  {
    "command": "chats pin",
    "description": "Pin a chat"
  },
  {
    "command": "chats unpin",
    "description": "Unpin a chat"
  },
  {
    "command": "chats mute",
    "description": "Mute a chat"
  },
  {
    "command": "chats unmute",
    "description": "Unmute a chat"
  },
  {
    "command": "chats mark-read",
    "description": "Mark a chat read"
  },
  {
    "command": "chats mark-unread",
    "description": "Mark a chat unread"
  },
  {
    "command": "chats low-priority",
    "description": "Move a chat to Low Priority"
  },
  {
    "command": "chats inbox",
    "description": "Move a chat to the inbox"
  },
  {
    "command": "chats notify-anyway",
    "description": "Notify a muted chat"
  },
  {
    "command": "chats title",
    "description": "Set a chat title"
  },
  {
    "command": "chats description",
    "description": "Set a chat description"
  },
  {
    "command": "chats avatar",
    "description": "Set a chat avatar"
  },
  {
    "command": "chats draft",
    "description": "Set a chat draft"
  },
  {
    "command": "chats clear-draft",
    "description": "Clear a chat draft"
  },
  {
    "command": "chats expiry",
    "description": "Set disappearing-message expiry"
  },
  {
    "command": "chats remind",
    "description": "Set a chat reminder"
  },
  {
    "command": "chats unremind",
    "description": "Clear a chat reminder"
  },
  {
    "command": "chats focus",
    "description": "Focus Beeper Desktop"
  },
  {
    "command": "messages list",
    "description": "List chat messages"
  },
  {
    "command": "messages search",
    "description": "Search messages"
  },
  {
    "command": "messages show",
    "description": "Show one message"
  },
  {
    "command": "messages context",
    "description": "Show message context"
  },
  {
    "command": "messages edit",
    "description": "Edit a message"
  },
  {
    "command": "messages delete",
    "description": "Delete a message"
  },
  {
    "command": "messages react",
    "description": "React to a message"
  },
  {
    "command": "messages unreact",
    "description": "Remove a reaction"
  },
  {
    "command": "send text",
    "description": "Send text"
  },
  {
    "command": "send file",
    "description": "Send a file"
  },
  {
    "command": "contacts list",
    "description": "List contacts"
  },
  {
    "command": "contacts search",
    "description": "Search contacts"
  },
  {
    "command": "contacts show",
    "description": "Show contact details"
  },
  {
    "command": "media download",
    "description": "Download message media"
  },
  {
    "command": "export",
    "description": "Export Beeper data"
  },
  {
    "command": "watch",
    "description": "Stream Desktop API events"
  },
  {
    "command": "rpc",
    "description": "Run JSONL command RPC"
  },
  {
    "command": "man",
    "description": "Print the command manual"
  },
  {
    "command": "doctor",
    "description": "Check target readiness"
  },
  {
    "command": "status",
    "description": "Show target status"
  },
  {
    "command": "docs",
    "description": "Open Beeper CLI docs"
  },
  {
    "command": "version",
    "description": "Print CLI version"
  },
  {
    "command": "completion",
    "description": "Print shell completion help"
  },
  {
    "command": "install desktop",
    "description": "Install Beeper Desktop"
  },
  {
    "command": "install server",
    "description": "Install Beeper Server"
  },
  {
    "command": "update",
    "description": "Check for updates"
  },
  {
    "command": "config get",
    "description": "Print CLI configuration"
  },
  {
    "command": "config set",
    "description": "Set CLI configuration"
  },
  {
    "command": "config path",
    "description": "Print the config path"
  },
  {
    "command": "config reset",
    "description": "Reset CLI configuration"
  },
  {
    "command": "api get",
    "description": "Call a raw GET endpoint"
  },
  {
    "command": "api post",
    "description": "Call a raw POST endpoint"
  }
]
