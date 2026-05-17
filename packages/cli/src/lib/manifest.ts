export type ManifestCommand = {
  command: string
  description: string
  examples?: string[]
}

export const commandManifest: ManifestCommand[] = [
  {
    command: 'setup',
    description: 'Make the selected target ready',
    examples: [
      'beeper setup',
      'beeper setup --local',
      'beeper setup --oauth',
      'beeper setup --remote https://desktop.example.com',
      'beeper setup --desktop --install',
    ],
  },
  {
    command: 'setup install desktop',
    description: 'Install Beeper Desktop locally',
    examples: ['beeper setup install desktop', 'beeper setup install desktop --channel nightly'],
  },
  {
    command: 'setup install server',
    description: 'Install Beeper Server locally',
    examples: ['beeper setup install server', 'beeper setup install server --server-env staging'],
  },
  {
    command: 'targets list',
    description: 'List Beeper targets',
    examples: ['beeper targets list', 'beeper targets list --json'],
  },
  {
    command: 'targets add desktop',
    description: 'Add a managed Beeper Desktop target',
    examples: ['beeper targets add desktop work --default'],
  },
  {
    command: 'targets add server',
    description: 'Add a managed Beeper Server target',
    examples: ['beeper targets add server prod --server-env production --default'],
  },
  {
    command: 'targets add remote',
    description: 'Add a remote Beeper Desktop or Server target',
    examples: ['beeper targets add remote work https://desktop.example.com --default'],
  },
  {
    command: 'targets use',
    description: 'Set the default target',
    examples: ['beeper targets use work'],
  },
  {
    command: 'targets show',
    description: 'Show target details',
    examples: ['beeper targets show', 'beeper targets show work'],
  },
  {
    command: 'targets status',
    description: 'Check target reachability',
    examples: ['beeper targets status', 'beeper targets status work --json'],
  },
  {
    command: 'targets start',
    description: 'Start a managed target',
    examples: ['beeper targets start work'],
  },
  {
    command: 'targets stop',
    description: 'Stop a managed target',
    examples: ['beeper targets stop work'],
  },
  {
    command: 'targets restart',
    description: 'Restart a managed target',
    examples: ['beeper targets restart work'],
  },
  {
    command: 'targets logs',
    description: 'Print managed target logs',
    examples: ['beeper targets logs work'],
  },
  {
    command: 'targets enable',
    description: 'Start a managed target at login',
    examples: ['beeper targets enable work'],
  },
  {
    command: 'targets disable',
    description: 'Stop starting a managed target at login',
    examples: ['beeper targets disable work'],
  },
  {
    command: 'targets remove',
    description: 'Remove a target',
    examples: ['beeper targets remove work'],
  },
  {
    command: 'auth status',
    description: 'Show local auth status and token metadata',
    examples: ['beeper auth status', 'beeper auth status --json'],
  },
  {
    command: 'auth logout',
    description: 'Clear stored authentication',
    examples: ['beeper auth logout'],
  },
  {
    command: 'auth verify',
    description: 'Continue (or start) a device verification flow interactively',
    examples: ['beeper auth verify', 'beeper auth verify --user @alice:beeper.com'],
  },
  {
    command: 'auth verify status',
    description: 'Show encryption readiness',
    examples: ['beeper auth verify status --json'],
  },
  {
    command: 'auth verify approve',
    description: 'Approve a pending device verification request',
    examples: ['beeper auth verify approve --id active'],
  },
  {
    command: 'auth verify recovery-key',
    description: 'Unlock encrypted messages with a recovery key',
    examples: ['beeper auth verify recovery-key --code ABCD-EFGH-IJKL'],
  },
  {
    command: 'auth verify reset-recovery-key',
    description: 'Create a new encrypted-messages recovery key',
    examples: ['beeper auth verify reset-recovery-key'],
  },
  {
    command: 'auth verify cancel',
    description: 'Cancel an in-progress device verification',
    examples: ['beeper auth verify cancel'],
  },
  {
    command: 'auth verify list',
    description: 'List active verification work',
    examples: ['beeper auth verify list'],
  },
  {
    command: 'auth verify start',
    description: 'Start a device verification request',
    examples: ['beeper auth verify start --user @alice:beeper.com'],
  },
  {
    command: 'auth verify show',
    description: 'Show active verification details',
    examples: ['beeper auth verify show --json'],
  },
  {
    command: 'auth verify sas',
    description: 'Start short-authentication-string (emoji) verification',
    examples: ['beeper auth verify sas'],
  },
  {
    command: 'auth verify sas-confirm',
    description: 'Confirm short-authentication-string (emoji) verification',
    examples: ['beeper auth verify sas-confirm'],
  },
  {
    command: 'auth verify qr-scan',
    description: 'Submit a scanned QR-code verification payload',
    examples: ['beeper auth verify qr-scan --payload "..."'],
  },
  {
    command: 'auth verify qr-confirm',
    description: 'Confirm that the other device scanned your QR code',
    examples: ['beeper auth verify qr-confirm'],
  },
  {
    command: 'accounts list',
    description: 'List connected accounts',
    examples: ['beeper accounts list', 'beeper accounts list --account whatsapp --json'],
  },
  {
    command: 'accounts add',
    description: 'Add a Beeper account by network type',
    examples: [
      'beeper accounts add',
      'beeper accounts add whatsapp',
      'beeper accounts add discord --non-interactive --cookie sessiontoken=...',
    ],
  },
  {
    command: 'accounts show',
    description: 'Show account details',
    examples: ['beeper accounts show whatsapp-main'],
  },
  {
    command: 'accounts remove',
    description: 'Remove an account',
    examples: ['beeper accounts remove whatsapp-main'],
  },
  {
    command: 'accounts use',
    description: 'Select a default account for account-scoped commands',
    examples: ['beeper accounts use whatsapp-main'],
  },
  {
    command: 'chats list',
    description: 'List chats',
    examples: [
      'beeper chats list',
      'beeper chats list --pinned --limit 50',
      'beeper chats list --unread --no-muted --json',
    ],
  },
  {
    command: 'chats search',
    description: 'Search chats',
    examples: ['beeper chats search Family'],
  },
  {
    command: 'chats show',
    description: 'Show chat details',
    examples: ['beeper chats show --chat "Family"', 'beeper chats show --chat \'!abc:beeper.com\''],
  },
  {
    command: 'chats start',
    description: 'Start a chat',
    examples: ['beeper chats start +15551234567', 'beeper chats start @alice:beeper.com --title "Alice"'],
  },
  {
    command: 'chats archive',
    description: 'Archive a chat',
    examples: ['beeper chats archive --chat "Family"'],
  },
  {
    command: 'chats unarchive',
    description: 'Unarchive a chat',
    examples: ['beeper chats unarchive --chat "Family"'],
  },
  {
    command: 'chats pin',
    description: 'Pin a chat',
    examples: ['beeper chats pin --chat "Family"'],
  },
  {
    command: 'chats unpin',
    description: 'Unpin a chat',
    examples: ['beeper chats unpin --chat "Family"'],
  },
  {
    command: 'chats mute',
    description: 'Mute a chat',
    examples: ['beeper chats mute --chat "Family" --duration 8h'],
  },
  {
    command: 'chats unmute',
    description: 'Unmute a chat',
    examples: ['beeper chats unmute --chat "Family"'],
  },
  {
    command: 'chats mark-read',
    description: 'Mark a chat as read',
    examples: ['beeper chats mark-read --chat "Family"'],
  },
  {
    command: 'chats mark-unread',
    description: 'Mark a chat as unread',
    examples: ['beeper chats mark-unread --chat "Family"'],
  },
  {
    command: 'chats priority',
    description: 'Move a chat to the Inbox or Low Priority',
    examples: [
      'beeper chats priority --chat "Family" --level inbox',
      'beeper chats priority --chat "Marketing" --level low',
    ],
  },
  {
    command: 'chats notify-anyway',
    description: 'Notify a muted chat',
    examples: ['beeper chats notify-anyway --chat "Family"'],
  },
  {
    command: 'chats rename',
    description: 'Rename a chat',
    examples: ['beeper chats rename --chat "Family" --title "Family ❤"'],
  },
  {
    command: 'chats description',
    description: 'Set a chat description',
    examples: [
      'beeper chats description --chat "Team" --description "Engineering chat"',
      'beeper chats description --chat "Team" --clear',
    ],
  },
  {
    command: 'chats avatar',
    description: 'Set a chat avatar',
    examples: ['beeper chats avatar --chat "Team" --file ./team.png'],
  },
  {
    command: 'chats draft',
    description: 'Set or clear a chat draft',
    examples: [
      'beeper chats draft --chat "Family" --text "on my way"',
      'beeper chats draft --chat "Family" --clear',
    ],
  },
  {
    command: 'chats disappear',
    description: 'Set disappearing-message expiry',
    examples: ['beeper chats disappear --chat "Friends" --seconds 86400'],
  },
  {
    command: 'chats remind',
    description: 'Set a chat reminder',
    examples: [
      'beeper chats remind --chat "Family" --when 2026-06-01T09:00:00Z',
      'beeper chats remind --chat "Family" --when 2026-06-01T09:00:00Z --dismiss-on-message',
    ],
  },
  {
    command: 'chats unremind',
    description: 'Clear a chat reminder',
    examples: ['beeper chats unremind --chat "Family"'],
  },
  {
    command: 'chats focus',
    description: 'Focus Beeper Desktop on a chat',
    examples: ['beeper chats focus --chat "Family"'],
  },
  {
    command: 'messages list',
    description: 'List chat messages',
    examples: [
      'beeper messages list --chat "Family" --limit 50',
      'beeper messages list --chat "Family" --before-cursor "<messageID>" --limit 100',
      'beeper messages list --chat "Family" --sender me --asc',
    ],
  },
  {
    command: 'messages search',
    description: 'Search messages across chats',
    examples: [
      'beeper messages search invoice',
      'beeper messages search --chat "Family" --sender me --media image',
      'beeper messages search "flight" --after 2026-01-01 --before 2026-02-01',
    ],
  },
  {
    command: 'messages show',
    description: 'Show one message',
    examples: ['beeper messages show --chat "Family" --id <messageID>'],
  },
  {
    command: 'messages context',
    description: 'Show message context',
    examples: ['beeper messages context --chat "Family" --id <messageID> --before 5 --after 5'],
  },
  {
    command: 'messages edit',
    description: 'Edit a message',
    examples: ['beeper messages edit --chat "Family" --id <messageID> --message "fixed"'],
  },
  {
    command: 'messages delete',
    description: 'Delete a message',
    examples: ['beeper messages delete --chat "Family" --id <messageID> --for-everyone'],
  },
  {
    command: 'messages react',
    description: 'React to a message',
    examples: ['beeper messages react --chat "Family" --id <messageID> --reaction "🎉"'],
  },
  {
    command: 'messages unreact',
    description: 'Remove a reaction',
    examples: ['beeper messages unreact --chat "Family" --id <messageID> --reaction "🎉"'],
  },
  {
    command: 'messages export',
    description: 'Export one chat\'s messages to JSON',
    examples: [
      'beeper messages export --chat "Family" --output family.json',
      'beeper messages export --chat "Family" --after 2026-01-01T00:00:00Z --output -',
      'beeper messages export --chat "Family" --before-cursor "<messageID>" --limit 500',
    ],
  },
  {
    command: 'send text',
    description: 'Send text',
    examples: [
      'beeper send text --to "Family" --message "on my way"',
      'beeper send text --to +15551234567 --message "hi" --reply-to <messageID>',
    ],
  },
  {
    command: 'send file',
    description: 'Send a file',
    examples: ['beeper send file --to "Family" --file ./photo.jpg --caption "from today"'],
  },
  {
    command: 'send react',
    description: 'Send a reaction to a message (alias of messages react)',
    examples: ['beeper send react --to "Family" --id <messageID> --reaction "🎉"'],
  },
  {
    command: 'send sticker',
    description: 'Send a sticker',
    examples: ['beeper send sticker --to "Family" --file ./hi.webp'],
  },
  {
    command: 'send voice',
    description: 'Send a voice note',
    examples: [
      'beeper send voice --to "Family" --file ./note.ogg',
      'beeper send voice --to "Family" --file ./note.ogg --duration 12',
    ],
  },
  {
    command: 'presence',
    description: 'Send a typing (or paused) indicator to a chat',
    examples: ['beeper presence --chat "Family"', 'beeper presence --chat "Family" --state paused'],
  },
  {
    command: 'contacts list',
    description: 'List contacts',
    examples: ['beeper contacts list --account whatsapp --query alice'],
  },
  {
    command: 'contacts search',
    description: 'Search contacts',
    examples: ['beeper contacts search alice'],
  },
  {
    command: 'contacts show',
    description: 'Show contact details',
    examples: ['beeper contacts show "Alice" --account whatsapp'],
  },
  {
    command: 'media download',
    description: 'Download message media',
    examples: [
      'beeper media download mxc://beeper.com/abc --out ./downloads',
      'beeper media download mxc://beeper.com/abc -o - > photo.jpg',
    ],
  },
  {
    command: 'export',
    description: 'Export accounts, chats, messages, Markdown transcripts, and attachments',
    examples: ['beeper export --out ./beeper-export', 'beeper export --chat "Family" --out ./family'],
  },
  {
    command: 'watch',
    description: 'Stream Desktop API WebSocket events',
    examples: [
      'beeper watch',
      'beeper watch --chat \'!abc:beeper.com\' --json',
      'beeper watch --webhook https://example.com/hook --webhook-secret "$BEEPER_WEBHOOK_SECRET"',
    ],
  },
  {
    command: 'rpc',
    description: 'Run newline-delimited JSON command RPC over stdin/stdout',
    examples: ['printf \'{"id":1,"command":"chats list --json"}\\n\' | beeper rpc'],
  },
  {
    command: 'man',
    description: 'Print the command manual',
    examples: ['beeper man', 'beeper man --json'],
  },
  {
    command: 'doctor',
    description: 'Probe the target live and report diagnostics',
    examples: ['beeper doctor', 'beeper doctor --json'],
  },
  {
    command: 'status',
    description: 'Print a snapshot of the selected target and readiness',
    examples: ['beeper status', 'beeper status --json'],
  },
  {
    command: 'docs',
    description: 'Open Beeper CLI docs',
    examples: ['beeper docs'],
  },
  {
    command: 'version',
    description: 'Print CLI version',
    examples: ['beeper version'],
  },
  {
    command: 'completion',
    description: 'Print shell completion help',
    examples: ['beeper completion'],
  },
  {
    command: 'update',
    description: 'Check and install Beeper updates',
    examples: ['beeper update --check', 'beeper update --cli', 'beeper update --server'],
  },
  {
    command: 'config get',
    description: 'Print CLI configuration',
    examples: ['beeper config get', 'beeper config get defaultTarget'],
  },
  {
    command: 'config set',
    description: 'Set a CLI configuration value',
    examples: ['beeper config set defaultTarget work'],
  },
  {
    command: 'config path',
    description: 'Print the CLI config path',
    examples: ['beeper config path'],
  },
  {
    command: 'config reset',
    description: 'Reset CLI configuration',
    examples: ['beeper config reset'],
  },
  {
    command: 'api get',
    description: 'Call a raw Desktop API GET path',
    examples: ['beeper api get /v1/info', 'beeper api get /v1/chats --json'],
  },
  {
    command: 'api post',
    description: 'Call a raw Desktop API POST path with a JSON body',
    examples: ['beeper api post /v1/chats/abc/read --body \'{"messageID":"x"}\''],
  },
]
