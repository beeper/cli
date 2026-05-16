# Beeper CLI

Command-line access to the [Beeper Desktop API](https://developers.beeper.com/desktop-api/).

The CLI is built with TypeScript, oclif, and the official `@beeper/desktop-api`
SDK. The command reference below is generated from the oclif command metadata in
the built CLI.

## Inspiration

This CLI is shamelessly inspired by [wacli](https://wacli.sh/), a WhatsApp CLI
that gets the command-line product shape right. The Beeper CLI borrows the same
basic taste: workflow-first commands, human-readable output by default, exact
`--json` for scripts, `--events` for long-running automation, `--read-only`
for safe agent/tool use, and command names that optimize for what people are
trying to do rather than for raw API resource names.

When in doubt, the model is simple: make the default output pleasant to read,
make machine output boring and stable, keep write commands explicit, and expose
one obvious command for each job.

## Install

Beeper CLI is distributed through Homebrew as a built release archive:

```sh
brew install beeper/tap/beeper-cli
```

The installed command is `beeper`.

## Plugins

Beeper CLI supports oclif plugins for third-party commands:

```sh
beeper plugins
beeper plugins install beeper-cli-plugin-example
beeper plugins uninstall beeper-cli-plugin-example
```

Plugin authors should depend on the stable SDK entrypoint instead of importing
CLI internals:

```ts
import { BeeperCommand, createBeeperClient, ensureWritable } from 'beeper-cli/plugin-sdk'
```

Plugins should use namespaced commands such as `beeper github issue create` and
must treat installed plugins as trusted code, because plugins run arbitrary Node.js.

## Local Development

```sh
npm install
npm run build
node ./bin/run.js --help
```

Run commands directly from TypeScript:

```sh
npm run dev -- --help
```

Regenerate this README after command, flag, or argument changes:

```sh
npm run readme
```

## Authenticate

```sh
beeper chats
beeper auth status
```

On first use, authenticated commands look for a local Beeper Desktop API on the
default port range. If Beeper Desktop is already signed in, the CLI immediately
uses OAuth2 Authorization Code with PKCE and stores the server URL and bearer
token in `~/.config/beeper/config.json`. After that, commands reuse the
remembered server URL.

If the local Desktop app is not authenticated, the CLI exits with an error
instead of starting another login flow. You can explicitly sign in the app
itself with:

```sh
beeper login --app-login --email you@example.com
```

For non-interactive use, pass a token through the environment:

```sh
BEEPER_ACCESS_TOKEN=... beeper chats --json
```

## Common Workflows

```sh
beeper doctor
beeper status
beeper accounts
beeper chats
beeper messages "Family"
beeper send text "Family" "on my way" --wait
beeper send file "Family" ./photo.jpg "from today"
beeper export --out ./beeper-export
beeper api get /v1/info
```

## Input Resolution

- Chat arguments accept Beeper chat IDs, local chat IDs, exact titles, or search text.
- Ambiguous chat matches return numbered choices; pass `--pick N` to select one.
- Account arguments accept account IDs, network names, bridge type/id, or account user identity.
- Account filters can expand a network name to multiple matching accounts.
- `contacts search` and `start-chat` can search across all accounts when `--account` is omitted.
- `contacts list` accepts the same account selectors as other account-scoped commands.

## Output

Most commands support:

- app-like text by default, optimized for scanning chats, messages, contacts, accounts, and assets
- `--json` for exact API-shaped structured output
- `--events` for NDJSON lifecycle events on stderr from long-running commands
- `--read-only` to reject commands that modify Beeper or local CLI state
- `--debug` for SDK debug logging
- `--base-url` to point at a different local Desktop API server

Use `beeper login --server-url URL` to remember a Desktop API server URL for
future commands.

`beeper commands --json` prints a compact command manifest for tools and agents.
`beeper llm` prints a concise human-readable command guide.

## Environment

| Environment variable | Description |
| --- | --- |
| `BEEPER_ACCESS_TOKEN` | Bearer token. Overrides stored OAuth login. |
| `BEEPER_DESKTOP_BASE_URL` | Beeper Desktop API base URL. Defaults to `http://localhost:23373`. |
| `BEEPER_BASE_URL` | SDK-compatible base URL fallback. |
| `BEEPER_CLI_CONFIG_DIR` | Override config directory for testing or isolated profiles. |

## Command Summary

| Command | Summary |
| --- | --- |
| `accounts` | List Chat Accounts connected to this Beeper Desktop instance, including bridge metadata and network identity. |
| `accounts add` | Add a Beeper account |
| `accounts add.d` |  |
| `accounts.d` |  |
| `api get` | Call a raw Desktop API GET path |
| `api get.d` |  |
| `api post` | Call a raw Desktop API POST path with a JSON body |
| `api post.d` |  |
| `app e2ee recovery-code mark-backed-up` | Mark the recovery key as saved |
| `app e2ee recovery-code mark-backed-up.d` |  |
| `app e2ee recovery-code reset begin` | Create a new recovery key |
| `app e2ee recovery-code reset begin.d` |  |
| `app e2ee recovery-code reset confirm` | Confirm a newly created recovery key |
| `app e2ee recovery-code reset confirm.d` |  |
| `app e2ee recovery-code verify` | Unlock encrypted messages with a recovery key |
| `app e2ee recovery-code verify.d` |  |
| `app e2ee verification accept` | Accept a device verification request |
| `app e2ee verification accept.d` |  |
| `app e2ee verification cancel` | Cancel device verification |
| `app e2ee verification cancel.d` |  |
| `app e2ee verification qr confirm-scanned` | Confirm another device scanned this QR code |
| `app e2ee verification qr confirm-scanned.d` |  |
| `app e2ee verification qr scan` | Submit a scanned verification QR payload |
| `app e2ee verification qr scan.d` |  |
| `app e2ee verification sas confirm` | Confirm matching emoji verification |
| `app e2ee verification sas confirm.d` |  |
| `app e2ee verification sas start` | Start emoji verification |
| `app e2ee verification sas start.d` |  |
| `app e2ee verification start` | Start device verification |
| `app e2ee verification start.d` |  |
| `app status` | Show Beeper app login and encrypted messaging state |
| `app status.d` |  |
| `archive` | Archive or unarchive a chat. Set archived=true to move to archive, archived=false to move back to inbox |
| `archive.d` |  |
| `assets download` | Download a Matrix file using its mxc:// or localmxc:// URL to the device running Beeper Desktop and return the local file URL. |
| `assets download.d` |  |
| `assets upload` | Upload a file to a temporary location using multipart/form-data. Returns an uploadID that can be referenced when sending a message or materializing a draft attachment. |
| `assets upload.d` |  |
| `auth status` | Show local auth status and token metadata |
| `auth status.d` |  |
| `autocomplete` | Display autocomplete installation instructions. |
| `avatar` | Set or clear a group chat avatar |
| `avatar.d` |  |
| `chat` | Retrieve chat details including metadata, participants, and latest message |
| `chat.d` |  |
| `chats` | List all chats sorted by last activity (most recent first). Combines all accounts into a single paginated list. |
| `chats index.d` |  |
| `chats search` | Search chats by title, network, or participant names. |
| `chats search.d` |  |
| `clear-draft` | Clear a chat draft |
| `clear-draft.d` |  |
| `commands` | Print the Beeper CLI command manifest |
| `commands.d` |  |
| `config get` | Print CLI configuration |
| `config get.d` |  |
| `config path` | Print the CLI config path |
| `config path.d` |  |
| `config reset` | Reset CLI configuration |
| `config reset.d` |  |
| `config set` | Set a CLI configuration value |
| `config set.d` |  |
| `contacts list` | List merged contacts for a specific account with cursor-based pagination. |
| `contacts list.d` |  |
| `contacts search` | Search contacts on a specific account using merged account contacts, network search, and exact identifier lookup. |
| `contacts search.d` |  |
| `create-chat` | Create a direct or group chat from participant IDs. Returns the created chat. |
| `create-chat.d` |  |
| `current-user` | Show the authenticated Desktop API user |
| `current-user.d` |  |
| `delete-message` | Delete a message by final message ID. Pending message IDs are not accepted because messages cannot be deleted while sending. |
| `delete-message.d` |  |
| `description` | Set or clear a group chat description |
| `description.d` |  |
| `doctor` | Verify Desktop API reachability and authentication |
| `doctor.d` |  |
| `draft` | Set a chat draft |
| `draft.d` |  |
| `edit` | Edit the text content of an existing message. Messages with attachments cannot be edited. |
| `edit.d` |  |
| `export` | Export accounts, chats, messages, Markdown transcripts, and attachments. |
| `export.d` |  |
| `focus` | Focus Beeper Desktop, optionally opening a chat or message |
| `focus.d` |  |
| `help` | Display help for beeper. |
| `inbox` | Move a chat to the primary inbox |
| `inbox.d` |  |
| `llm` | Print compact CLI help for agents |
| `llm.d` |  |
| `login` | Authenticate with local Beeper Desktop |
| `login.d` |  |
| `logout` | Remove the locally stored Beeper Desktop token |
| `logout.d` |  |
| `low-priority` | Move a chat to Low Priority |
| `low-priority.d` |  |
| `message` | Retrieve a message by final message ID, pendingMessageID, or Matrix event ID. Chat ID may be a Beeper chat ID or local chat ID. |
| `message-expiry` | Set or clear disappearing-message expiry |
| `message-expiry.d` |  |
| `message.d` |  |
| `messages` | List all messages in a chat with cursor-based pagination. Sorted by timestamp. |
| `messages index.d` |  |
| `messages search` | Search messages across chats. |
| `messages search.d` |  |
| `mute` | Mute a chat |
| `mute.d` |  |
| `notify-anyway` | Force a delivery notification when supported by the underlying network. Currently intended for iMessage on macOS; unsupported networks return an error. |
| `notify-anyway.d` |  |
| `pin` | Pin a chat |
| `pin.d` |  |
| `react` | Add a reaction to an existing message. |
| `react.d` |  |
| `read` | Mark a chat as read, optionally through a specific message ID. |
| `read.d` |  |
| `remind` | Set a reminder for a chat at a specific time |
| `remind.d` |  |
| `rpc` | Run newline-delimited JSON command RPC |
| `rpc.d` |  |
| `search` | Search chats and messages |
| `search.d` |  |
| `send file` | Send a file to a chat |
| `send file.d` |  |
| `send text` | Send a text message to a specific chat. Supports replying to existing messages. Returns a pending message ID. |
| `send text.d` |  |
| `shell` | Run an interactive Beeper CLI shell |
| `shell.d` |  |
| `start-chat` | Resolve a user/contact and open a direct chat. Reuses and returns an existing direct chat when one is found. Available in Beeper Desktop v4.2.808+. |
| `start-chat.d` |  |
| `status` | Check Beeper Desktop API status |
| `status.d` |  |
| `title` | Set a custom chat title |
| `title.d` |  |
| `unarchive` | Archive or unarchive a chat. Set archived=true to move to archive, archived=false to move back to inbox |
| `unarchive.d` |  |
| `unmute` | Unmute a chat |
| `unmute.d` |  |
| `unpin` | Unpin a chat |
| `unpin.d` |  |
| `unreact` | Remove the reaction added by the authenticated user from an existing message. |
| `unreact.d` |  |
| `unread` | Mark a chat as unread, optionally from a specific message ID. |
| `unread.d` |  |
| `unremind` | Clear an existing reminder from a chat |
| `unremind.d` |  |
| `watch` | Stream Desktop API WebSocket events |
| `watch.d` |  |

## Command Reference

### `beeper accounts`
List Chat Accounts connected to this Beeper Desktop instance, including bridge metadata and network identity.

```sh
beeper accounts
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper accounts add`
Add a Beeper account

```sh
beeper accounts add [account]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `account` | no | Account type to add, for example WhatsApp, Discord, or local-whatsapp |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--cookie=<value>...` | option | Cookie value for non-interactive login, in name=value form. Repeat for multiple cookies. |
| `--field=<value>...` | option | Field value for non-interactive login, in id=value form. Repeat for multiple fields. |
| `--flow=<value>` | option | Login flow ID. If omitted, Desktop chooses the default flow. |
| `--guided` | boolean | Prompt through login steps until completion |
| `--login-id=<value>` | option | Existing login ID to re-login as |
| `--non-interactive` | boolean | Do not prompt; require --flow, --field, and --cookie values when needed. |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper accounts add.d`

```sh
beeper accounts add.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper accounts.d`

```sh
beeper accounts.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper api get`
Call a raw Desktop API GET path

```sh
beeper api get <path>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `path` | yes | API path, for example /v1/info |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper api get.d`

```sh
beeper api get.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper api post`
Call a raw Desktop API POST path with a JSON body

```sh
beeper api post <path>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `path` | yes | API path, for example /v1/messages/{chatID}/send |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--body=<value>` | option | JSON request body Default: {} |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper api post.d`

```sh
beeper api post.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee recovery-code mark-backed-up`
Mark the recovery key as saved

```sh
beeper app e2ee recovery-code mark-backed-up
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee recovery-code mark-backed-up.d`

```sh
beeper app e2ee recovery-code mark-backed-up.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee recovery-code reset begin`
Create a new recovery key

```sh
beeper app e2ee recovery-code reset begin
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--recovery-code=<value>` | option | Existing recovery key, if available |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee recovery-code reset begin.d`

```sh
beeper app e2ee recovery-code reset begin.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee recovery-code reset confirm`
Confirm a newly created recovery key

```sh
beeper app e2ee recovery-code reset confirm <recoveryCode>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `recoveryCode` | yes | New recovery key returned by reset begin |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee recovery-code reset confirm.d`

```sh
beeper app e2ee recovery-code reset confirm.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee recovery-code verify`
Unlock encrypted messages with a recovery key

```sh
beeper app e2ee recovery-code verify <recoveryCode>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `recoveryCode` | yes | Beeper recovery key |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee recovery-code verify.d`

```sh
beeper app e2ee recovery-code verify.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee verification accept`
Accept a device verification request

```sh
beeper app e2ee verification accept <txnID>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `txnID` | yes | Verification transaction ID |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee verification accept.d`

```sh
beeper app e2ee verification accept.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee verification cancel`
Cancel device verification

```sh
beeper app e2ee verification cancel <txnID>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `txnID` | yes | Verification transaction ID |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--code=<value>` | option | Optional cancellation code |
| `--reason=<value>` | option | Optional cancellation reason |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee verification cancel.d`

```sh
beeper app e2ee verification cancel.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee verification qr confirm-scanned`
Confirm another device scanned this QR code

```sh
beeper app e2ee verification qr confirm-scanned <txnID>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `txnID` | yes | Verification transaction ID |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee verification qr confirm-scanned.d`

```sh
beeper app e2ee verification qr confirm-scanned.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee verification qr scan`
Submit a scanned verification QR payload

```sh
beeper app e2ee verification qr scan <data>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `data` | yes | QR code payload |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee verification qr scan.d`

```sh
beeper app e2ee verification qr scan.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee verification sas confirm`
Confirm matching emoji verification

```sh
beeper app e2ee verification sas confirm <txnID>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `txnID` | yes | Verification transaction ID |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee verification sas confirm.d`

```sh
beeper app e2ee verification sas confirm.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee verification sas start`
Start emoji verification

```sh
beeper app e2ee verification sas start <txnID>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `txnID` | yes | Verification transaction ID |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee verification sas start.d`

```sh
beeper app e2ee verification sas start.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee verification start`
Start device verification

```sh
beeper app e2ee verification start
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--user-id=<value>` | option | User ID to verify. Defaults to the signed-in user. |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app e2ee verification start.d`

```sh
beeper app e2ee verification start.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app status`
Show Beeper app login and encrypted messaging state

```sh
beeper app status
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper app status.d`

```sh
beeper app status.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper archive`
Archive or unarchive a chat. Set archived=true to move to archive, archived=false to move back to inbox

```sh
beeper archive <chat>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper archive.d`

```sh
beeper archive.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper assets download`
Download a Matrix file using its mxc:// or localmxc:// URL to the device running Beeper Desktop and return the local file URL.

```sh
beeper assets download <url>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `url` | yes | Asset URL |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper assets download.d`

```sh
beeper assets download.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper assets upload`
Upload a file to a temporary location using multipart/form-data. Returns an uploadID that can be referenced when sending a message or materializing a draft attachment.

```sh
beeper assets upload <file>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `file` | yes | The file to upload (max 500 MB). |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--file-name=<value>` | option | Original filename. Defaults to the uploaded file name if omitted |
| `--mime-type=<value>` | option | MIME type. Auto-detected from magic bytes if omitted |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper assets upload.d`

```sh
beeper assets upload.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper auth status`
Show local auth status and token metadata

```sh
beeper auth status
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper auth status.d`

```sh
beeper auth status.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper autocomplete`
Display autocomplete installation instructions.

```sh
beeper autocomplete [shell]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `shell` | no | Shell type |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `-r, --refresh-cache` | boolean | Refresh cache (ignores displaying instructions) |

### `beeper avatar`
Set or clear a group chat avatar

```sh
beeper avatar <chat> [path]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |
| `path` | no | Local avatar image path. Omit with --clear to remove it. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--clear` | boolean | Clear the current avatar |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper avatar.d`

```sh
beeper avatar.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper chat`
Retrieve chat details including metadata, participants, and latest message

```sh
beeper chat <chat>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--max-participants=<value>` | option | Maximum participants to return |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper chat.d`

```sh
beeper chat.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper chats`
List all chats sorted by last activity (most recent first). Combines all accounts into a single paginated list.

```sh
beeper chats
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--account=<value>...` | option | Limit to Account ID, network, bridge, or account user |
| `--ids` | boolean | Print only chat IDs |
| `--limit=<value>` | option | Maximum chats to print Default: 20 |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper chats index.d`

```sh
beeper chats index.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper chats search`
Search chats by title, network, or participant names.

```sh
beeper chats search <query>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `query` | yes | User-typed search text. Literal word matching (non-semantic). |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--account=<value>...` | option | Limit to Account ID, network, bridge, or account user |
| `--ids` | boolean | Print only chat IDs |
| `--inbox=<primary\|low-priority\|archive>` | option |  |
| `--include-muted` | boolean | Include muted chats. Use --no-include-muted for a tighter search. |
| `--last-activity-after=<value>` | option | Only chats with last activity after this ISO timestamp |
| `--last-activity-before=<value>` | option | Only chats with last activity before this ISO timestamp |
| `--limit=<value>` | option | Maximum chats to print Default: 20 |
| `--scope=<titles\|participants>` | option |  |
| `--type=<single\|group\|any>` | option |  |
| `--unread` | boolean | Only unread chats |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper chats search.d`

```sh
beeper chats search.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper clear-draft`
Clear a chat draft

```sh
beeper clear-draft <chat>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID, local chat ID, title, or search text |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper clear-draft.d`

```sh
beeper clear-draft.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper commands`
Print the Beeper CLI command manifest

```sh
beeper commands
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper commands.d`

```sh
beeper commands.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper config get`
Print CLI configuration

```sh
beeper config get [key]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `key` | no | Optional config key to print |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper config get.d`

```sh
beeper config get.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper config path`
Print the CLI config path

```sh
beeper config path
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper config path.d`

```sh
beeper config path.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper config reset`
Reset CLI configuration

```sh
beeper config reset
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper config reset.d`

```sh
beeper config reset.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper config set`
Set a CLI configuration value

```sh
beeper config set <key> <value>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `key` | yes | Config key to set |
| `value` | yes | Config value |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper config set.d`

```sh
beeper config set.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper contacts list`
List merged contacts for a specific account with cursor-based pagination.

```sh
beeper contacts list <account>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `account` | yes | Account ID, network, bridge, or account user |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--ids` | boolean | Print only contact user IDs |
| `--limit=<value>` | option | Maximum contacts to print Default: 50 |
| `--query=<value>` | option | Optional blended contact lookup query |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper contacts list.d`

```sh
beeper contacts list.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper contacts search`
Search contacts on a specific account using merged account contacts, network search, and exact identifier lookup.

```sh
beeper contacts search <query>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `query` | yes | Contact search query |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--account=<value>...` | option | Account ID, network, bridge, or account user. Omit to search every account. |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper contacts search.d`

```sh
beeper contacts search.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper create-chat`
Create a direct or group chat from participant IDs. Returns the created chat.

```sh
beeper create-chat
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--account=<value>` | option | Account ID, network, bridge, or account user Required. |
| `--message=<value>` | option | Optional first message |
| `--participant=<value>...` | option | Participant user ID Required. |
| `--title=<value>` | option | Group title |
| `--type=<single\|group>` | option | Chat type Default: single |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper create-chat.d`

```sh
beeper create-chat.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper current-user`
Show the authenticated Desktop API user

```sh
beeper current-user
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper current-user.d`

```sh
beeper current-user.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper delete-message`
Delete a message by final message ID. Pending message IDs are not accepted because messages cannot be deleted while sending.

```sh
beeper delete-message <chat> <message>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |
| `message` | yes | Message ID. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--for-everyone` | boolean | True to request deletion for everyone when the network supports it; false to delete only for the authenticated user when supported. |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper delete-message.d`

```sh
beeper delete-message.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper description`
Set or clear a group chat description

```sh
beeper description <chat> [description]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |
| `description` | no | New description. Omit with --clear to remove it. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--clear` | boolean | Clear the current description |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper description.d`

```sh
beeper description.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper doctor`
Verify Desktop API reachability and authentication

```sh
beeper doctor
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper doctor.d`

```sh
beeper doctor.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper draft`
Set a chat draft

```sh
beeper draft <chat> <text>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID, local chat ID, title, or search text |
| `text` | yes | Draft text |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--file=<value>` | option | Draft attachment file |
| `--file-name=<value>` | option | Attachment display filename |
| `--mime-type=<value>` | option | Attachment MIME type |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper draft.d`

```sh
beeper draft.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper edit`
Edit the text content of an existing message. Messages with attachments cannot be edited.

```sh
beeper edit <chat> <message> <text>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |
| `message` | yes | Message ID. |
| `text` | yes | Draft text. Plain text and Markdown are converted to Matrix HTML with the same rules used by send and edit. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper edit.d`

```sh
beeper edit.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper export`
Export accounts, chats, messages, Markdown transcripts, and attachments.

```sh
beeper export
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--account=<value>...` | option | Limit to an account selector. Repeat to include more accounts. |
| `--chat=<value>...` | option | Limit to a chat selector. Repeat to include more chats. |
| `--force` | boolean | Re-export chats even if checkpoint state says they are complete. |
| `--limit-chats=<value>` | option | Maximum chats to export. Intended for testing large exports. |
| `--limit-messages=<value>` | option | Maximum messages per chat. Intended for testing large exports. |
| `--max-participants=<value>` | option | Maximum participants to include in each chat.json. Default: 500 |
| `--no-attachments` | boolean | Skip downloading message attachments. |
| `-o, --out=<value>` | option | Export directory. Default: beeper-export |
| `--pick=<value>` | option | Pick the Nth chat when a --chat selector is ambiguous. |
| `--quiet` | boolean | Suppress progress output. |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper export.d`

```sh
beeper export.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper focus`
Focus Beeper Desktop, optionally opening a chat or message

```sh
beeper focus [chat] [message]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | no | Chat ID, local chat ID, title, or search text |
| `message` | no | Message ID |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--attachment=<value>` | option | Draft attachment path |
| `--draft=<value>` | option | Draft text |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper focus.d`

```sh
beeper focus.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper help`
Display help for beeper.

```sh
beeper help [command]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `command` | no | Command to show help for. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `-n, --nested-commands` | boolean | Include all nested commands in the output. |

### `beeper inbox`
Move a chat to the primary inbox

```sh
beeper inbox <chat>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper inbox.d`

```sh
beeper inbox.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper llm`
Print compact CLI help for agents

```sh
beeper llm
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper llm.d`

```sh
beeper llm.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper login`
Authenticate with local Beeper Desktop

```sh
beeper login
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--accept-terms` | boolean | Accept the Terms of Use and acknowledge the Privacy Policy when creating an account |
| `--app-login` | boolean | Sign in the local Beeper Desktop app itself instead of requesting a Desktop API token from an already-signed-in app |
| `--client-name=<value>` | option | OAuth client name shown in Beeper Desktop Default: Beeper CLI |
| `--code=<value>` | option | Email sign-in code |
| `--email=<value>` | option | Email address to send a sign-in code to |
| `--no-open` | boolean | Print the authorization URL instead of opening a browser |
| `--no-save` | boolean | Do not store the returned Desktop API token |
| `--oauth` | boolean | Use the OAuth2 PKCE Desktop API authorization flow |
| `--scope=<value>` | option | Space-separated OAuth scopes Default: read write |
| `--server-url=<value>` | option | Beeper Desktop API server URL |
| `--username=<value>` | option | Username to create if registration is required |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper login.d`

```sh
beeper login.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper logout`
Remove the locally stored Beeper Desktop token

```sh
beeper logout
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper logout.d`

```sh
beeper logout.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper low-priority`
Move a chat to Low Priority

```sh
beeper low-priority <chat>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper low-priority.d`

```sh
beeper low-priority.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper message`
Retrieve a message by final message ID, pendingMessageID, or Matrix event ID. Chat ID may be a Beeper chat ID or local chat ID.

```sh
beeper message <chat> <message>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |
| `message` | yes | Message ID. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper message-expiry`
Set or clear disappearing-message expiry

```sh
beeper message-expiry <chat> <seconds>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |
| `seconds` | yes | Expiry in seconds, or "off" |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper message-expiry.d`

```sh
beeper message-expiry.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper message.d`

```sh
beeper message.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper messages`
List all messages in a chat with cursor-based pagination. Sorted by timestamp.

```sh
beeper messages <chat>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--after=<value>` | option | Fetch messages after cursor |
| `--before=<value>` | option | Fetch messages before cursor |
| `--ids` | boolean | Print only message IDs |
| `--limit=<value>` | option | Maximum messages to print Default: 50 |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper messages index.d`

```sh
beeper messages index.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper messages search`
Search messages across chats.

```sh
beeper messages search [query]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `query` | no | User-typed search text. Literal word matching (non-semantic). |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--account=<value>...` | option | Limit to Account ID, network, bridge, or account user |
| `--chat=<value>...` | option | Limit to Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |
| `--chat-type=<group\|single>` | option | Limit to group chats or direct messages |
| `--date-after=<value>` | option | Only messages after this ISO timestamp |
| `--date-before=<value>` | option | Only messages before this ISO timestamp |
| `--exclude-low-priority` | boolean | Exclude low-priority chats. Use --no-exclude-low-priority to include all. |
| `--ids` | boolean | Print only message IDs |
| `--include-muted` | boolean | Include muted chats. Use --no-include-muted for a tighter search. |
| `--limit=<value>` | option | Maximum messages to print Default: 50 |
| `--media=<any\|video\|image\|link\|file>...` | option | Filter by media type. Repeat for more types. |
| `--sender=<value>` | option | me, others, or a user ID |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper messages search.d`

```sh
beeper messages search.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper mute`
Mute a chat

```sh
beeper mute <chat>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID, local chat ID, title, or search text |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper mute.d`

```sh
beeper mute.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper notify-anyway`
Force a delivery notification when supported by the underlying network. Currently intended for iMessage on macOS; unsupported networks return an error.

```sh
beeper notify-anyway <chat>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper notify-anyway.d`

```sh
beeper notify-anyway.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper pin`
Pin a chat

```sh
beeper pin <chat>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper pin.d`

```sh
beeper pin.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper react`
Add a reaction to an existing message.

```sh
beeper react <chat> <message> <reaction>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |
| `message` | yes | Message ID. |
| `reaction` | yes | Reaction key to add (emoji, shortcode, or custom emoji key) |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |
| `--transaction=<value>` | option | Optional transaction ID |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper react.d`

```sh
beeper react.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper read`
Mark a chat as read, optionally through a specific message ID.

```sh
beeper read <chat>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--message=<value>` | option | Message ID. |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper read.d`

```sh
beeper read.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper remind`
Set a reminder for a chat at a specific time

```sh
beeper remind <chat> <when>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |
| `when` | yes | Timestamp when the reminder should trigger. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--dismiss-on-message` | boolean | Cancel if someone messages in the chat |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper remind.d`

```sh
beeper remind.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper rpc`
Run newline-delimited JSON command RPC

```sh
beeper rpc
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper rpc.d`

```sh
beeper rpc.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper search`
Search chats and messages

```sh
beeper search <query>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `query` | yes | Literal search query |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper search.d`

```sh
beeper search.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper send file`
Send a file to a chat

```sh
beeper send file <chat> <file> [text]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |
| `file` | yes | The file to upload (max 500 MB). |
| `text` | no | Draft text. Plain text and Markdown are converted to Matrix HTML with the same rules used by send and edit. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--file-name=<value>` | option | Original filename. Defaults to the uploaded file name if omitted |
| `--mime-type=<value>` | option | MIME type. Auto-detected from magic bytes if omitted |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |
| `--reply-to=<value>` | option | Provide a message ID to send this as a reply to an existing message |
| `--wait` | boolean | Wait for the pending message to resolve |
| `--wait-interval=<value>` | option | Milliseconds between message status checks Default: 750 |
| `--wait-timeout=<value>` | option | Milliseconds to wait for message resolution Default: 30000 |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper send file.d`

```sh
beeper send file.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper send text`
Send a text message to a specific chat. Supports replying to existing messages. Returns a pending message ID.

```sh
beeper send text <chat> <text>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |
| `text` | yes | Draft text. Plain text and Markdown are converted to Matrix HTML with the same rules used by send and edit. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--file=<value>` | option | The file to upload (max 500 MB). |
| `--file-name=<value>` | option | Original filename. Defaults to the uploaded file name if omitted |
| `--mime-type=<value>` | option | MIME type. Auto-detected from magic bytes if omitted |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |
| `--reply-to=<value>` | option | Provide a message ID to send this as a reply to an existing message |
| `--wait` | boolean | Wait for the pending message to resolve |
| `--wait-interval=<value>` | option | Milliseconds between message status checks Default: 750 |
| `--wait-timeout=<value>` | option | Milliseconds to wait for message resolution Default: 30000 |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper send text.d`

```sh
beeper send text.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper shell`
Run an interactive Beeper CLI shell

```sh
beeper shell
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper shell.d`

```sh
beeper shell.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper start-chat`
Resolve a user/contact and open a direct chat. Reuses and returns an existing direct chat when one is found. Available in Beeper Desktop v4.2.808+.

```sh
beeper start-chat [query]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `query` | no | Phone, email, username, user ID, or name |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--account=<value>...` | option | Account ID, network, bridge, or account user. Omit to try every account. |
| `--allow-invite` | boolean | Allow invite-based DM creation when required |
| `--email=<value>` | option | Email address |
| `--id=<value>` | option | Known user ID |
| `--message=<value>` | option | Optional first message |
| `--name=<value>` | option | Display name hint |
| `--phone=<value>` | option | Phone number |
| `--username=<value>` | option | Username |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper start-chat.d`

```sh
beeper start-chat.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper status`
Check Beeper Desktop API status

```sh
beeper status
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper status.d`

```sh
beeper status.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper title`
Set a custom chat title

```sh
beeper title <chat> <title>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |
| `title` | yes | New chat title |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper title.d`

```sh
beeper title.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper unarchive`
Archive or unarchive a chat. Set archived=true to move to archive, archived=false to move back to inbox

```sh
beeper unarchive <chat>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper unarchive.d`

```sh
beeper unarchive.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper unmute`
Unmute a chat

```sh
beeper unmute <chat>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID, local chat ID, title, or search text |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper unmute.d`

```sh
beeper unmute.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper unpin`
Unpin a chat

```sh
beeper unpin <chat>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper unpin.d`

```sh
beeper unpin.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper unreact`
Remove the reaction added by the authenticated user from an existing message.

```sh
beeper unreact <chat> <message> <reaction>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |
| `message` | yes | Message ID. |
| `reaction` | yes | Reaction key to add (emoji, shortcode, or custom emoji key) |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper unreact.d`

```sh
beeper unreact.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper unread`
Mark a chat as unread, optionally from a specific message ID.

```sh
beeper unread <chat>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--message=<value>` | option | Message ID. |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper unread.d`

```sh
beeper unread.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper unremind`
Clear an existing reminder from a chat

```sh
beeper unremind <chat>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `chat` | yes | Chat ID. Input routes also accept the local chat ID from this Beeper Desktop installation when available. Also accepts exact chat titles or search text. |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--pick=<value>` | option | Pick the Nth chat when the input is ambiguous |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper unremind.d`

```sh
beeper unremind.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper watch`
Stream Desktop API WebSocket events

```sh
beeper watch
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `-c, --chat=<value>...` | option | Chat ID to subscribe to. Defaults to all chats. |

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

### `beeper watch.d`

```sh
beeper watch.d
```

Global flags: `--base-url`, `--debug`, `--events`, `--json`, `--read-only`.

## Publishing

Beeper CLI releases are built as Homebrew archives and uploaded to GitHub
Releases. Push a `v*` tag to run `.github/workflows/publish-release.yml`.

The release workflow:

- runs the TypeScript test suite
- builds a Homebrew archive containing the compiled CLI and production dependencies
- uploads the archive to the GitHub release
- updates `beeper/homebrew-tap` with the pinned archive SHA

Required repository secrets:

- `HOMEBREW_TAP_GITHUB_TOKEN`
