export type ManifestCommand = {
  command: string
  description: string
  examples?: string[]
}

export const commandManifest: ManifestCommand[] = [
  {
    command: 'setup',
    description: 'Make the selected target ready for messaging',
    examples: [
      'beeper setup',
      'beeper setup --local',
      'beeper setup --oauth',
      'beeper setup --remote https://desktop.example.com',
      'beeper setup --desktop --install',
    ],
  },
  {
    command: 'install desktop',
    description: 'Install Beeper Desktop locally',
    examples: ['beeper install desktop', 'beeper install desktop --channel nightly'],
  },
  {
    command: 'install server',
    description: 'Install Beeper Server locally',
    examples: ['beeper install server', 'beeper install server --server-env staging'],
  },
  {
    command: 'targets list',
    description: 'List configured Beeper targets',
    examples: ['beeper targets list', 'beeper targets list --json'],
  },
  {
    command: 'bridges list',
    description: 'List bridges that can connect chat accounts',
    examples: ['beeper bridges list', 'beeper bridges list --provider local --json'],
  },
  {
    command: 'bridges show',
    description: 'Show bridge details, login flows, and connected accounts',
    examples: ['beeper bridges show local-whatsapp', 'beeper bridges show telegram'],
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
    description: 'Check endpoint and process reachability for a target',
    examples: ['beeper targets status', 'beeper targets status work --json'],
  },
  {
    command: 'targets start',
    description: 'Start a local Server target or open Beeper Desktop',
    examples: ['beeper targets start work'],
  },
  {
    command: 'targets stop',
    description: 'Stop a local Beeper Server target',
    examples: ['beeper targets stop work'],
  },
  {
    command: 'targets restart',
    description: 'Restart a local Beeper Server target',
    examples: ['beeper targets restart work'],
  },
  {
    command: 'targets logs',
    description: 'Print logs for a local Beeper Desktop or Server install',
    examples: ['beeper targets logs work'],
  },
  {
    command: 'targets enable',
    description: 'Enable a local Beeper Server target at login',
    examples: ['beeper targets enable work'],
  },
  {
    command: 'targets disable',
    description: 'Disable a local Beeper Server target at login',
    examples: ['beeper targets disable work'],
  },
  {
    command: 'targets remove',
    description: 'Remove a target',
    examples: ['beeper targets remove work'],
  },
  {
    command: 'targets tunnel',
    description: 'Expose a local Desktop API over a public Cloudflare tunnel',
    examples: [
      'beeper targets tunnel',
      'beeper targets tunnel --target work --read-only',
      'beeper targets tunnel --as work-laptop --port 23373',
    ],
  },
  {
    command: 'auth status',
    description: 'Show stored auth for the selected target',
    examples: ['beeper auth status', 'beeper auth status --json'],
  },
  {
    command: 'auth logout',
    description: 'Clear stored authentication',
    examples: ['beeper auth logout'],
  },
  {
    command: 'verify',
    description: 'Finish setup verification or verify another device',
    examples: ['beeper verify', 'beeper verify --user @alice:beeper.com'],
  },
  {
    command: 'verify status',
    description: 'Show encryption and device-verification readiness',
    examples: ['beeper verify status --json'],
  },
  {
    command: 'verify approve',
    description: 'Approve a pending device verification request',
    examples: ['beeper verify approve --id active'],
  },
  {
    command: 'verify recovery-key',
    description: 'Unlock encrypted messages with a recovery key',
    examples: ['beeper verify recovery-key --key ABCD-EFGH-IJKL'],
  },
  {
    command: 'verify reset-recovery-key',
    description: 'Create a new encrypted-messages recovery key',
    examples: ['beeper verify reset-recovery-key'],
  },
  {
    command: 'verify cancel',
    description: 'Cancel an in-progress device verification',
    examples: ['beeper verify cancel'],
  },
  {
    command: 'verify list',
    description: 'List active verification work',
    examples: ['beeper verify list'],
  },
  {
    command: 'verify start',
    description: 'Start a device verification request',
    examples: ['beeper verify start --user @alice:beeper.com'],
  },
  {
    command: 'verify show',
    description: 'Show the current active verification request',
    examples: ['beeper verify show --json'],
  },
  {
    command: 'verify sas',
    description: 'Start emoji verification',
    examples: ['beeper verify sas'],
  },
  {
    command: 'verify sas-confirm',
    description: 'Confirm matching emoji verification',
    examples: ['beeper verify sas-confirm'],
  },
  {
    command: 'verify qr-scan',
    description: 'Submit a scanned QR-code verification payload',
    examples: ['beeper verify qr-scan --payload "..."'],
  },
  {
    command: 'verify qr-confirm',
    description: 'Confirm that the other device scanned your QR code',
    examples: ['beeper verify qr-confirm'],
  },
  {
    command: 'accounts list',
    description: 'List connected accounts',
    examples: ['beeper accounts list', 'beeper accounts list --account whatsapp --json'],
  },
  {
    command: 'accounts add',
    description: 'Connect a chat account by bridge',
    examples: [
      'beeper accounts add',
      'beeper accounts add local-whatsapp',
      'beeper accounts add discord --non-interactive --cookie sessiontoken=...',
      'beeper accounts add discord --webview --webview-backend chrome',
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
    examples: ['beeper chats show --chat 10313', 'beeper chats show --chat \'!plUOsWkvMmJmJPVAjS:beeper.com\''],
  },
  {
    command: 'chats start',
    description: 'Start a chat',
    examples: ['beeper chats start +15551234567', 'beeper chats start @alice:beeper.com --title "Alice"'],
  },
  {
    command: 'chats archive',
    description: 'Archive a chat',
    examples: ['beeper chats archive --chat 10313'],
  },
  {
    command: 'chats unarchive',
    description: 'Unarchive a chat',
    examples: ['beeper chats unarchive --chat 10313'],
  },
  {
    command: 'chats pin',
    description: 'Pin a chat',
    examples: ['beeper chats pin --chat 10313'],
  },
  {
    command: 'chats unpin',
    description: 'Unpin a chat',
    examples: ['beeper chats unpin --chat 10313'],
  },
  {
    command: 'chats mute',
    description: 'Mute a chat',
    examples: ['beeper chats mute --chat 10313'],
  },
  {
    command: 'chats unmute',
    description: 'Unmute a chat',
    examples: ['beeper chats unmute --chat 10313'],
  },
  {
    command: 'chats mark-read',
    description: 'Mark a chat as read',
    examples: ['beeper chats mark-read --chat 10313'],
  },
  {
    command: 'chats mark-unread',
    description: 'Mark a chat as unread',
    examples: ['beeper chats mark-unread --chat 10313'],
  },
  {
    command: 'chats priority',
    description: 'Move a chat to the Inbox or Low Priority',
    examples: [
      'beeper chats priority --chat 10313 --level inbox',
      'beeper chats priority --chat \'!plUOsWkvMmJmJPVAjS:beeper.com\' --level low',
    ],
  },
  {
    command: 'chats notify-anyway',
    description: 'Send an iMessage Notify Anyway alert',
    examples: ['beeper chats notify-anyway --chat 10313'],
  },
  {
    command: 'chats rename',
    description: 'Rename a chat',
    examples: ['beeper chats rename --chat 10313 --title "Family"'],
  },
  {
    command: 'chats description',
    description: 'Set a chat description',
    examples: [
      'beeper chats description --chat 10313 --description "Engineering chat"',
      'beeper chats description --chat 10313 --clear',
    ],
  },
  {
    command: 'chats avatar',
    description: 'Set a chat avatar',
    examples: ['beeper chats avatar --chat 10313 --file ./team.png'],
  },
  {
    command: 'chats draft',
    description: 'Set or clear a chat draft',
    examples: [
      'beeper chats draft --chat 10313 --text "on my way"',
      'beeper chats draft --chat 10313 --clear',
    ],
  },
  {
    command: 'chats disappear',
    description: 'Set disappearing-message expiry',
    examples: ['beeper chats disappear --chat 10313 --seconds 86400'],
  },
  {
    command: 'chats remind',
    description: 'Set a chat reminder',
    examples: [
      'beeper chats remind --chat 10313 --when 2026-06-01T09:00:00Z',
      'beeper chats remind --chat 10313 --when 2026-06-01T09:00:00Z --dismiss-on-message',
    ],
  },
  {
    command: 'chats unremind',
    description: 'Clear a chat reminder',
    examples: ['beeper chats unremind --chat 10313'],
  },
  {
    command: 'chats focus',
    description: 'Focus Beeper Desktop on a chat',
    examples: ['beeper chats focus --chat 10313'],
  },
  {
    command: 'messages list',
    description: 'List chat messages',
    examples: [
      'beeper messages list --chat 10313 --limit 50',
      'beeper messages list --chat 10313 --before-cursor "<messageID>" --limit 100',
      'beeper messages list --chat 10313 --sender me --asc',
    ],
  },
  {
    command: 'messages search',
    description: 'Search messages across chats',
    examples: [
      'beeper messages search invoice',
      'beeper messages search --chat 10313 --sender me --media image',
      'beeper messages search "flight" --after 2026-01-01 --before 2026-02-01',
    ],
  },
  {
    command: 'messages show',
    description: 'Show one message',
    examples: ['beeper messages show --chat 10313 --id <messageID>'],
  },
  {
    command: 'messages context',
    description: 'Show message context',
    examples: ['beeper messages context --chat 10313 --id <messageID> --before 5 --after 5'],
  },
  {
    command: 'messages edit',
    description: 'Edit a message',
    examples: ['beeper messages edit --chat 10313 --id <messageID> --message "fixed"'],
  },
  {
    command: 'messages delete',
    description: 'Delete a message',
    examples: ['beeper messages delete --chat 10313 --id <messageID> --for-everyone'],
  },
  {
    command: 'messages export',
    description: 'Export one chat to JSON',
    examples: [
      'beeper messages export --chat 10313 --output chat.json',
      'beeper messages export --chat 8951 --after 2026-01-01T00:00:00Z --output -',
      'beeper messages export --chat \'!plUOsWkvMmJmJPVAjS:beeper.com\' --before-cursor "<messageID>" --limit 500',
    ],
  },
  {
    command: 'send text',
    description: 'Send a text message',
    examples: [
      'beeper send text --to 10313 --message "on my way"',
      'beeper send text --to 8951 --message "hi"',
      'beeper send text --to "Family" --message "hi" --pick 1',
    ],
  },
  {
    command: 'send file',
    description: 'Send a file',
    examples: ['beeper send file --to 8951 --file ./photo.jpg --caption "from today"'],
  },
  {
    command: 'send react',
    description: 'Send a reaction to a message',
    examples: ['beeper send react --to 10313 --id <messageID> --reaction "+1"'],
  },
  {
    command: 'send sticker',
    description: 'Send a sticker',
    examples: ['beeper send sticker --to 10313 --file ./hi.webp'],
  },
  {
    command: 'send unreact',
    description: 'Remove a reaction from a message',
    examples: ['beeper send unreact --to 10313 --id <messageID> --reaction "+1"'],
  },
  {
    command: 'send voice',
    description: 'Send a voice note',
    examples: [
      'beeper send voice --to 10313 --file ./note.ogg',
      'beeper send voice --to 10313 --file ./note.ogg --duration 12',
    ],
  },
  {
    command: 'presence',
    description: 'Send a typing (or paused) indicator to a chat',
    examples: [
      'beeper presence --chat 10313',
      'beeper presence --chat 10313 --state paused',
      'beeper presence --chat 10313 --duration 5',
    ],
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
    examples: ['beeper export --out ./beeper-export', 'beeper export --chat 10313 --out ./chat'],
  },
  {
    command: 'watch',
    description: 'Stream Desktop API WebSocket events',
    examples: [
      'beeper watch',
      'beeper watch --chat 10313 --json',
      'beeper watch --include-type message.upserted --include-type message.deleted',
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
    description: 'Show selected target and setup readiness',
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
    description: 'Print shell completion setup',
    examples: ['beeper completion'],
  },
  {
    command: 'plugins',
    description: 'Manage Beeper CLI plugins',
    examples: ['beeper plugins', 'beeper plugins install @beeper/cli-plugin-cloudflare'],
  },
  {
    command: 'plugins available',
    description: 'List recommended optional Beeper CLI plugins',
    examples: ['beeper plugins available', 'beeper plugins available --json'],
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
  {
    command: 'api request',
    description: 'Call a raw Desktop API path with any supported HTTP method',
    examples: ['beeper api request DELETE /v1/chats/abc/messages/def/reactions --body \'{"reactionKey":"👍"}\''],
  },
]
