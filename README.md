# Beeper CLI - Beeper from your terminal

A scriptable Beeper client for people and agents. It controls Beeper Desktop
or Beeper Server through a selected target, then gives you setup, verification,
bridge discovery, account management, chat search, message reading, sending,
media downloads, exports, diagnostics, and raw API access from the command line.

> Requires a running Beeper Desktop API or a configured Beeper Server target.

Command manual: `beeper man`

## Features

- **Setup + readiness** - `setup`, `verify`, `status`, and `doctor` guide a target from login through encrypted-message readiness.
- **Targets** - use local Desktop, managed Desktop, managed Server, or remote Beeper API targets with one selected default. A target is an endpoint profile: local Server, local Desktop, Desktop API, or a profile that combines Desktop/Server runtime state.
- **Bridges + accounts** - list bridge connectors, inspect login flows and capabilities, connect accounts, switch defaults, inspect details, and remove accounts.
- **Chats + contacts + labels** - list, search, start, archive, pin, mute, mark, rename, label, focus, and inspect chats across accounts.
- **Messages + media + presence** - list, search, show, edit, delete, react, send text/files/reactions, send typing indicators, and download message media.
- **Exports** - `export` for full chats/transcripts/attachments and `messages export` for one-chat JSON.
- **Automation** - `--json` everywhere, NDJSON `--events`, `watch` (WS + outbound webhooks with HMAC), `rpc` over stdin/stdout, `man --json` for tool manifests.
- **Safety** - `--read-only` rejects mutating commands; raw API access stays explicit under `api get` and `api post`.

## Install

### Homebrew

```sh
brew install beeper/tap/beeper-cli
```

The installed command is `beeper`.

### npm

```sh
npx beeper-cli --help
npm install -g beeper-cli
```

The package name is `beeper-cli`; the installed command is `beeper`.

### Build from source

Install dependencies before running these commands.

```sh
bun --filter beeper-cli run build
bun --filter beeper-cli run dev -- --help
```

For local CLI development inside `packages/cli`:

```sh
bun run dev -- --help
```

Regenerate this README after command, flag, or argument changes:

```sh
bun run readme
```

## Quick start

```sh
# 1. Prepare the selected target
beeper setup

# 2. Check readiness
beeper status
beeper doctor

# 3. Inspect accounts and chats
beeper accounts list
beeper bridges list
beeper chats list

# 4. Read and search messages
beeper messages list --chat 10313 --limit 50
beeper messages search "flight"

# 5. Send
beeper send text --to 10313 --message "on my way"
beeper send file --to 8951 --file ./photo.jpg --caption "from today"

# 6. Export
beeper export --out ./beeper-export
```

`beeper setup` makes the selected target ready. By default it looks for Beeper
Desktop on this device and offers to use the existing Desktop session. Use
`setup --local` for the direct Desktop-session path, `setup --oauth` for the
browser-authorized path, `setup --remote URL` for a remote Desktop or Server,
and `setup --server --install` or `setup --desktop --install` to orchestrate
installation and target setup. To install runtimes directly: `install desktop`
and `install server`.

`install desktop` and `install server` install runtimes directly.
`setup --desktop --install` and `setup --server --install` are one-shot
setup paths that install when needed, then configure the target.

For non-interactive use, pass a token through the environment:

```sh
BEEPER_ACCESS_TOKEN=... beeper chats --json
```

## Documentation

| Topic | Page | Commands |
| --- | --- | --- |
| **Setup** | [setup](docs/setup.md) · [auth](docs/auth.md) | `setup` · `install desktop` · `install server` · `verify` · `status` · `doctor` · `auth status` |
| **Targets** | [targets](docs/targets.md) | `targets list` · `targets add desktop` · `targets add server` · `targets add remote` · `targets use` · `targets status` · `targets logs` |
| **Bridges + accounts** | [accounts](docs/accounts.md) | `bridges list` · `bridges show` · `accounts list` · `accounts add` · `accounts show` · `accounts use` · `accounts remove` |
| **Chats** | [chats](docs/chats.md) | `chats list` · `chats search` · `chats show` · `chats start` · `chats archive` · `chats pin` · `chats mute` · `chats priority` · `chats remind` · `chats rename` · `chats draft` · `chats focus` |
| **Messages** | [messages](docs/messages.md) · [send](docs/send.md) · [presence](docs/presence.md) | `messages list` · `messages search` · `messages export` · `send text` · `send file` · `send sticker` · `send voice` · `send react` · `presence` |
| **Contacts + media** | [contacts](docs/contacts.md) · [media](docs/media.md) · [export](docs/export.md) | `contacts list` · `contacts search` · `media download` · `export` |
| **Automation** | [watch](docs/watch.md) · [rpc](docs/rpc.md) · [api](docs/api.md) | `watch` · `watch --webhook` · `rpc` · `man` · `api get` · `api post` · `api request` |
| **Maintenance** | [config](docs/config.md) · [update](docs/update.md) | `update` · `config` · `completion` · `docs` · `version` |

Use `beeper docs` to open the CLI docs and `beeper man` to print the local
command manual.

## Plugins

Beeper CLI supports optional oclif plugins. List recommended Beeper plugins:

```sh
beeper plugins available
```

Install a published plugin:

```sh
beeper plugins install @beeper/cli-plugin-cloudflare
```

For plugin development, import from `beeper-cli/plugin-sdk` and expose oclif
commands from your package. Link a local plugin while working on it:

```sh
beeper plugins link ./packages/cli-plugin-cloudflare
beeper targets tunnel --help
```

First-party optional plugins:

| Package | Adds |
| --- | --- |
| `@beeper/cli-plugin-cloudflare` | `targets tunnel` for exposing a selected Beeper target through Cloudflare Tunnel. |

## Configuration

Default Desktop API target: `http://127.0.0.1:23373`.

**Global flags:** `--base-url`, `--target`, `--json`, `--events`,
`--full`, `--timeout`, `--read-only`, `--debug`, `--yes`, `--quiet`.

**Environment overrides:**

| Variable | Effect |
| --- | --- |
| `BEEPER_ACCESS_TOKEN` | Bearer token. Overrides stored OAuth login. |
| `BEEPER_DESKTOP_BASE_URL` | Beeper Desktop API base URL. Defaults to `http://127.0.0.1:23373`. |
| `BEEPER_READONLY` | `1`/`true`/`yes`/`on` enables read-only mode. |
| `BEEPER_CLI_CONFIG_DIR` | Override config directory for testing or isolated profiles. |

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success. |
| `1` | Generic runtime error. |
| `2` | Usage error (parsing, validation, missing required flag/arg, read-only refusal). |
| `3` | Auth required (no stored token; sign in to Beeper Desktop or set `BEEPER_ACCESS_TOKEN`). |
| `4` | Target/account not ready (`doctor` reports this when readiness is not `ready`). |
| `5` | Selector matched nothing (unknown target, account, chat, contact). |
| `6` | Ambiguous selector (multiple matches; pass an exact ID or `--pick N`). |

JSON output preserves the same envelope on failure: `{"success":false,"data":null,"error":"...","exitCode":N}` written to stderr.

## Addressing

- Chat arguments accept numeric local chat IDs, full Beeper/Matrix chat IDs, iMessage chat IDs, exact titles, or search text.
- For scripts on the same target/profile, prefer the numeric local chat ID shown by `beeper chats list`; use the full Beeper/Matrix chat ID when the selector must work across targets or profiles.
- Numeric local chat IDs come from the selected Desktop database. Treat them as local to that target/profile.
- Ambiguous chat matches return numbered choices; pass `--pick N` to select one.
- Account arguments accept account IDs, network names, bridge type/id, or account user identity.
- Account filters can expand a network name to multiple matching accounts.
- `contacts search` and `chats start` can search across all accounts when `--account` is omitted.
- `contacts list` accepts the same account selectors as other account-scoped commands.

## Output and scripting

Most commands support:

- app-like text by default, optimized for scanning chats, messages, contacts, accounts, and media
- `--json` for `{"success":true,"data":...,"error":null}` output on stdout
- `--events` for NDJSON lifecycle events on stderr from long-running commands
- `--read-only` to reject commands that modify Beeper or local CLI state
- `--full` to disable truncation
- `--debug` for SDK debug logging
- `--target` or `--base-url` to point at a different target

`man --json` prints a compact command manifest for tools and agents.
`rpc` runs newline-delimited JSON command RPC over stdin/stdout.

## Raw API access

Raw Desktop API calls live under `api`, so scripts can reach a new endpoint
before a workflow command exists:

```sh
beeper api get /v1/info
beeper api post /v1/messages/{chatID}/send --body '{"text":"hello"}'
```

## Inspiration

This CLI is shamelessly inspired by [wacli](https://wacli.sh/), a WhatsApp CLI
that gets the command-line product shape right. Beeper CLI borrows the same
taste: workflow-first commands, readable default output, boring machine output,
explicit writes, and names based on what people are trying to do.

## Command Summary

| Command | Summary |
| --- | --- |
| `setup` | Make the selected target ready for messaging |
| `install desktop` | Install Beeper Desktop locally |
| `install server` | Install Beeper Server locally |
| `targets list` | List configured Beeper targets |
| `bridges list` | List bridges that can connect chat accounts |
| `bridges show` | Show bridge details, login flows, and connected accounts |
| `targets add desktop` | Add a managed Beeper Desktop target |
| `targets add server` | Add a managed Beeper Server target |
| `targets add remote` | Add a remote Beeper Desktop or Server target |
| `targets use` | Set the default target |
| `targets show` | Show target details |
| `targets status` | Check endpoint and process reachability for a target |
| `targets start` | Start a managed target |
| `targets stop` | Stop a managed target |
| `targets restart` | Restart a managed target |
| `targets logs` | Print managed target logs |
| `targets enable` | Enable managed target startup at login |
| `targets disable` | Disable managed target startup at login |
| `targets remove` | Remove a target |
| `targets tunnel` | Expose a local Desktop API over a public Cloudflare tunnel |
| `auth status` | Show stored auth for the selected target |
| `auth logout` | Clear stored authentication |
| `verify` | Finish setup verification or verify another device |
| `verify status` | Show encryption and device-verification readiness |
| `verify approve` | Approve a pending device verification request |
| `verify recovery-key` | Unlock encrypted messages with a recovery key |
| `verify reset-recovery-key` | Create a new encrypted-messages recovery key |
| `verify cancel` | Cancel an in-progress device verification |
| `verify list` | List active verification work |
| `verify start` | Start a device verification request |
| `verify show` | Show the current active verification request |
| `verify sas` | Start emoji verification |
| `verify sas-confirm` | Confirm matching emoji verification |
| `verify qr-scan` | Submit a scanned QR-code verification payload |
| `verify qr-confirm` | Confirm that the other device scanned your QR code |
| `accounts list` | List connected accounts |
| `accounts add` | Connect a chat account by bridge |
| `accounts show` | Show account details |
| `accounts remove` | Remove an account |
| `accounts use` | Select a default account for account-scoped commands |
| `chats list` | List chats |
| `chats search` | Search chats |
| `chats show` | Show chat details |
| `chats start` | Start a chat |
| `chats archive` | Archive a chat |
| `chats unarchive` | Unarchive a chat |
| `chats pin` | Pin a chat |
| `chats unpin` | Unpin a chat |
| `chats mute` | Mute a chat |
| `chats unmute` | Unmute a chat |
| `chats mark-read` | Mark a chat as read |
| `chats mark-unread` | Mark a chat as unread |
| `chats priority` | Move a chat to the Inbox or Low Priority |
| `chats notify-anyway` | Send an iMessage Notify Anyway alert |
| `chats rename` | Rename a chat |
| `chats description` | Set a chat description |
| `chats avatar` | Set a chat avatar |
| `chats draft` | Set or clear a chat draft |
| `chats disappear` | Set disappearing-message expiry |
| `chats remind` | Set a chat reminder |
| `chats unremind` | Clear a chat reminder |
| `chats focus` | Focus Beeper Desktop on a chat |
| `messages list` | List chat messages |
| `messages search` | Search messages across chats |
| `messages show` | Show one message |
| `messages context` | Show message context |
| `messages edit` | Edit a message |
| `messages delete` | Delete a message |
| `messages export` | Export one chat to JSON |
| `send text` | Send a text message |
| `send file` | Send a file |
| `send react` | Send a reaction to a message |
| `send sticker` | Send a sticker |
| `send unreact` | Remove a reaction from a message |
| `send voice` | Send a voice note |
| `presence` | Send a typing (or paused) indicator to a chat |
| `contacts list` | List contacts |
| `contacts search` | Search contacts |
| `contacts show` | Show contact details |
| `media download` | Download message media |
| `export` | Export accounts, chats, messages, Markdown transcripts, and attachments |
| `watch` | Stream Desktop API WebSocket events |
| `rpc` | Run newline-delimited JSON command RPC over stdin/stdout |
| `man` | Print the command manual |
| `doctor` | Probe the target live and report diagnostics |
| `status` | Show selected target and setup readiness |
| `docs` | Open Beeper CLI docs |
| `version` | Print CLI version |
| `completion` | Print shell completion setup |
| `plugins` | Manage Beeper CLI plugins |
| `plugins available` | List recommended optional Beeper CLI plugins |
| `update` | Check and install Beeper updates |
| `config get` | Print CLI configuration |
| `config set` | Set a CLI configuration value |
| `config path` | Print the CLI config path |
| `config reset` | Reset CLI configuration |
| `api get` | Call a raw Desktop API GET path |
| `api post` | Call a raw Desktop API POST path with a JSON body |
| `api request` | Call a raw Desktop API path with any supported HTTP method |

## Command Reference

### `beeper setup`
Make the selected target ready for messaging

```sh
beeper setup
```

Examples:

```sh
beeper setup
beeper setup --local
beeper setup --oauth
beeper setup --remote https://desktop.example.com
beeper setup --desktop --install
```

### `beeper install desktop`
Install Beeper Desktop locally

```sh
beeper install desktop
```

Examples:

```sh
beeper install desktop
beeper install desktop --channel nightly
```

### `beeper install server`
Install Beeper Server locally

```sh
beeper install server
```

Examples:

```sh
beeper install server
beeper install server --server-env staging
```

### `beeper targets list`
List configured Beeper targets

```sh
beeper targets list
```

Examples:

```sh
beeper targets list
beeper targets list --json
```

### `beeper bridges list`
List bridges that can connect chat accounts

```sh
beeper bridges list
```

Examples:

```sh
beeper bridges list
beeper bridges list --provider local --json
```

### `beeper bridges show`
Show bridge details, login flows, and connected accounts

```sh
beeper bridges show
```

Examples:

```sh
beeper bridges show local-whatsapp
beeper bridges show telegram
```

### `beeper targets add desktop`
Add a managed Beeper Desktop target

```sh
beeper targets add desktop
```

Examples:

```sh
beeper targets add desktop work --default
```

### `beeper targets add server`
Add a managed Beeper Server target

```sh
beeper targets add server
```

Examples:

```sh
beeper targets add server prod --server-env production --default
```

### `beeper targets add remote`
Add a remote Beeper Desktop or Server target

```sh
beeper targets add remote
```

Examples:

```sh
beeper targets add remote work https://desktop.example.com --default
```

### `beeper targets use`
Set the default target

```sh
beeper targets use
```

Examples:

```sh
beeper targets use work
```

### `beeper targets show`
Show target details

```sh
beeper targets show
```

Examples:

```sh
beeper targets show
beeper targets show work
```

### `beeper targets status`
Check endpoint and process reachability for a target

```sh
beeper targets status
```

Examples:

```sh
beeper targets status
beeper targets status work --json
```

### `beeper targets start`
Start a managed target

```sh
beeper targets start
```

Examples:

```sh
beeper targets start work
```

### `beeper targets stop`
Stop a managed target

```sh
beeper targets stop
```

Examples:

```sh
beeper targets stop work
```

### `beeper targets restart`
Restart a managed target

```sh
beeper targets restart
```

Examples:

```sh
beeper targets restart work
```

### `beeper targets logs`
Print managed target logs

```sh
beeper targets logs
```

Examples:

```sh
beeper targets logs work
```

### `beeper targets enable`
Enable managed target startup at login

```sh
beeper targets enable
```

Examples:

```sh
beeper targets enable work
```

### `beeper targets disable`
Disable managed target startup at login

```sh
beeper targets disable
```

Examples:

```sh
beeper targets disable work
```

### `beeper targets remove`
Remove a target

```sh
beeper targets remove
```

Examples:

```sh
beeper targets remove work
```

### `beeper targets tunnel`
Expose a local Desktop API over a public Cloudflare tunnel

```sh
beeper targets tunnel
```

Examples:

```sh
beeper targets tunnel
beeper targets tunnel --target work --read-only
beeper targets tunnel --as work-laptop --port 23373
```

### `beeper auth status`
Show stored auth for the selected target

```sh
beeper auth status
```

Examples:

```sh
beeper auth status
beeper auth status --json
```

### `beeper auth logout`
Clear stored authentication

```sh
beeper auth logout
```

Examples:

```sh
beeper auth logout
```

### `beeper verify`
Finish setup verification or verify another device

```sh
beeper verify
```

Examples:

```sh
beeper verify
beeper verify --user @alice:beeper.com
```

### `beeper verify status`
Show encryption and device-verification readiness

```sh
beeper verify status
```

Examples:

```sh
beeper verify status --json
```

### `beeper verify approve`
Approve a pending device verification request

```sh
beeper verify approve
```

Examples:

```sh
beeper verify approve --id active
```

### `beeper verify recovery-key`
Unlock encrypted messages with a recovery key

```sh
beeper verify recovery-key
```

Examples:

```sh
beeper verify recovery-key --key ABCD-EFGH-IJKL
```

### `beeper verify reset-recovery-key`
Create a new encrypted-messages recovery key

```sh
beeper verify reset-recovery-key
```

Examples:

```sh
beeper verify reset-recovery-key
```

### `beeper verify cancel`
Cancel an in-progress device verification

```sh
beeper verify cancel
```

Examples:

```sh
beeper verify cancel
```

### `beeper verify list`
List active verification work

```sh
beeper verify list
```

Examples:

```sh
beeper verify list
```

### `beeper verify start`
Start a device verification request

```sh
beeper verify start
```

Examples:

```sh
beeper verify start --user @alice:beeper.com
```

### `beeper verify show`
Show the current active verification request

```sh
beeper verify show
```

Examples:

```sh
beeper verify show --json
```

### `beeper verify sas`
Start emoji verification

```sh
beeper verify sas
```

Examples:

```sh
beeper verify sas
```

### `beeper verify sas-confirm`
Confirm matching emoji verification

```sh
beeper verify sas-confirm
```

Examples:

```sh
beeper verify sas-confirm
```

### `beeper verify qr-scan`
Submit a scanned QR-code verification payload

```sh
beeper verify qr-scan
```

Examples:

```sh
beeper verify qr-scan --payload "..."
```

### `beeper verify qr-confirm`
Confirm that the other device scanned your QR code

```sh
beeper verify qr-confirm
```

Examples:

```sh
beeper verify qr-confirm
```

### `beeper accounts list`
List connected accounts

```sh
beeper accounts list
```

Examples:

```sh
beeper accounts list
beeper accounts list --account whatsapp --json
```

### `beeper accounts add`
Connect a chat account by bridge

```sh
beeper accounts add
```

Examples:

```sh
beeper accounts add
beeper accounts add local-whatsapp
beeper accounts add discord --non-interactive --cookie sessiontoken=...
```

### `beeper accounts show`
Show account details

```sh
beeper accounts show
```

Examples:

```sh
beeper accounts show whatsapp-main
```

### `beeper accounts remove`
Remove an account

```sh
beeper accounts remove
```

Examples:

```sh
beeper accounts remove whatsapp-main
```

### `beeper accounts use`
Select a default account for account-scoped commands

```sh
beeper accounts use
```

Examples:

```sh
beeper accounts use whatsapp-main
```

### `beeper chats list`
List chats

```sh
beeper chats list
```

Examples:

```sh
beeper chats list
beeper chats list --pinned --limit 50
beeper chats list --unread --no-muted --json
```

### `beeper chats search`
Search chats

```sh
beeper chats search
```

Examples:

```sh
beeper chats search Family
```

### `beeper chats show`
Show chat details

```sh
beeper chats show
```

Examples:

```sh
beeper chats show --chat 10313
beeper chats show --chat '!plUOsWkvMmJmJPVAjS:beeper.com'
```

### `beeper chats start`
Start a chat

```sh
beeper chats start
```

Examples:

```sh
beeper chats start +15551234567
beeper chats start @alice:beeper.com --title "Alice"
```

### `beeper chats archive`
Archive a chat

```sh
beeper chats archive
```

Examples:

```sh
beeper chats archive --chat 10313
```

### `beeper chats unarchive`
Unarchive a chat

```sh
beeper chats unarchive
```

Examples:

```sh
beeper chats unarchive --chat 10313
```

### `beeper chats pin`
Pin a chat

```sh
beeper chats pin
```

Examples:

```sh
beeper chats pin --chat 10313
```

### `beeper chats unpin`
Unpin a chat

```sh
beeper chats unpin
```

Examples:

```sh
beeper chats unpin --chat 10313
```

### `beeper chats mute`
Mute a chat

```sh
beeper chats mute
```

Examples:

```sh
beeper chats mute --chat 10313
```

### `beeper chats unmute`
Unmute a chat

```sh
beeper chats unmute
```

Examples:

```sh
beeper chats unmute --chat 10313
```

### `beeper chats mark-read`
Mark a chat as read

```sh
beeper chats mark-read
```

Examples:

```sh
beeper chats mark-read --chat 10313
```

### `beeper chats mark-unread`
Mark a chat as unread

```sh
beeper chats mark-unread
```

Examples:

```sh
beeper chats mark-unread --chat 10313
```

### `beeper chats priority`
Move a chat to the Inbox or Low Priority

```sh
beeper chats priority
```

Examples:

```sh
beeper chats priority --chat 10313 --level inbox
beeper chats priority --chat '!plUOsWkvMmJmJPVAjS:beeper.com' --level low
```

### `beeper chats notify-anyway`
Send an iMessage Notify Anyway alert

```sh
beeper chats notify-anyway
```

Examples:

```sh
beeper chats notify-anyway --chat 10313
```

### `beeper chats rename`
Rename a chat

```sh
beeper chats rename
```

Examples:

```sh
beeper chats rename --chat 10313 --title "Family"
```

### `beeper chats description`
Set a chat description

```sh
beeper chats description
```

Examples:

```sh
beeper chats description --chat 10313 --description "Engineering chat"
beeper chats description --chat 10313 --clear
```

### `beeper chats avatar`
Set a chat avatar

```sh
beeper chats avatar
```

Examples:

```sh
beeper chats avatar --chat 10313 --file ./team.png
```

### `beeper chats draft`
Set or clear a chat draft

```sh
beeper chats draft
```

Examples:

```sh
beeper chats draft --chat 10313 --text "on my way"
beeper chats draft --chat 10313 --clear
```

### `beeper chats disappear`
Set disappearing-message expiry

```sh
beeper chats disappear
```

Examples:

```sh
beeper chats disappear --chat 10313 --seconds 86400
```

### `beeper chats remind`
Set a chat reminder

```sh
beeper chats remind
```

Examples:

```sh
beeper chats remind --chat 10313 --when 2026-06-01T09:00:00Z
beeper chats remind --chat 10313 --when 2026-06-01T09:00:00Z --dismiss-on-message
```

### `beeper chats unremind`
Clear a chat reminder

```sh
beeper chats unremind
```

Examples:

```sh
beeper chats unremind --chat 10313
```

### `beeper chats focus`
Focus Beeper Desktop on a chat

```sh
beeper chats focus
```

Examples:

```sh
beeper chats focus --chat 10313
```

### `beeper messages list`
List chat messages

```sh
beeper messages list
```

Examples:

```sh
beeper messages list --chat 10313 --limit 50
beeper messages list --chat 10313 --before-cursor "<messageID>" --limit 100
beeper messages list --chat 10313 --sender me --asc
```

### `beeper messages search`
Search messages across chats

```sh
beeper messages search
```

Examples:

```sh
beeper messages search invoice
beeper messages search --chat 10313 --sender me --media image
beeper messages search "flight" --after 2026-01-01 --before 2026-02-01
```

### `beeper messages show`
Show one message

```sh
beeper messages show
```

Examples:

```sh
beeper messages show --chat 10313 --id <messageID>
```

### `beeper messages context`
Show message context

```sh
beeper messages context
```

Examples:

```sh
beeper messages context --chat 10313 --id <messageID> --before 5 --after 5
```

### `beeper messages edit`
Edit a message

```sh
beeper messages edit
```

Examples:

```sh
beeper messages edit --chat 10313 --id <messageID> --message "fixed"
```

### `beeper messages delete`
Delete a message

```sh
beeper messages delete
```

Examples:

```sh
beeper messages delete --chat 10313 --id <messageID> --for-everyone
```

### `beeper messages export`
Export one chat to JSON

```sh
beeper messages export
```

Examples:

```sh
beeper messages export --chat 10313 --output chat.json
beeper messages export --chat 8951 --after 2026-01-01T00:00:00Z --output -
beeper messages export --chat '!plUOsWkvMmJmJPVAjS:beeper.com' --before-cursor "<messageID>" --limit 500
```

### `beeper send text`
Send a text message

```sh
beeper send text
```

Examples:

```sh
beeper send text --to 10313 --message "on my way"
beeper send text --to "Family" --message "hi" --pick 1
```

### `beeper send file`
Send a file

```sh
beeper send file
```

Examples:

```sh
beeper send file --to 8951 --file ./photo.jpg --caption "from today"
```

### `beeper send react`
Send a reaction to a message

```sh
beeper send react
```

Examples:

```sh
beeper send react --to 10313 --id <messageID> --reaction "+1"
```

### `beeper send sticker`
Send a sticker

```sh
beeper send sticker
```

Examples:

```sh
beeper send sticker --to 10313 --file ./hi.webp
```

### `beeper send unreact`
Remove a reaction from a message

```sh
beeper send unreact
```

Examples:

```sh
beeper send unreact --to 10313 --id <messageID> --reaction "+1"
```

### `beeper send voice`
Send a voice note

```sh
beeper send voice
```

Examples:

```sh
beeper send voice --to 10313 --file ./note.ogg
beeper send voice --to 10313 --file ./note.ogg --duration 12
```

### `beeper presence`
Send a typing (or paused) indicator to a chat

```sh
beeper presence
```

Examples:

```sh
beeper presence --chat 10313
beeper presence --chat 10313 --state paused
beeper presence --chat 10313 --duration 5
```

### `beeper contacts list`
List contacts

```sh
beeper contacts list
```

Examples:

```sh
beeper contacts list --account whatsapp --query alice
```

### `beeper contacts search`
Search contacts

```sh
beeper contacts search
```

Examples:

```sh
beeper contacts search alice
```

### `beeper contacts show`
Show contact details

```sh
beeper contacts show
```

Examples:

```sh
beeper contacts show "Alice" --account whatsapp
```

### `beeper media download`
Download message media

```sh
beeper media download
```

Examples:

```sh
beeper media download mxc://beeper.com/abc --out ./downloads
beeper media download mxc://beeper.com/abc -o - > photo.jpg
```

### `beeper export`
Export accounts, chats, messages, Markdown transcripts, and attachments

```sh
beeper export
```

Examples:

```sh
beeper export --out ./beeper-export
beeper export --chat 10313 --out ./chat
```

### `beeper watch`
Stream Desktop API WebSocket events

```sh
beeper watch
```

Examples:

```sh
beeper watch
beeper watch --chat 10313 --json
beeper watch --include-type message.upserted --include-type message.deleted
beeper watch --webhook https://example.com/hook --webhook-secret "$BEEPER_WEBHOOK_SECRET"
```

### `beeper rpc`
Run newline-delimited JSON command RPC over stdin/stdout

```sh
beeper rpc
```

Examples:

```sh
printf '{"id":1,"command":"chats list --json"}\n' | beeper rpc
```

### `beeper man`
Print the command manual

```sh
beeper man
```

Examples:

```sh
beeper man
beeper man --json
```

### `beeper doctor`
Probe the target live and report diagnostics

```sh
beeper doctor
```

Examples:

```sh
beeper doctor
beeper doctor --json
```

### `beeper status`
Show selected target and setup readiness

```sh
beeper status
```

Examples:

```sh
beeper status
beeper status --json
```

### `beeper docs`
Open Beeper CLI docs

```sh
beeper docs
```

Examples:

```sh
beeper docs
```

### `beeper version`
Print CLI version

```sh
beeper version
```

Examples:

```sh
beeper version
```

### `beeper completion`
Print shell completion setup

```sh
beeper completion
```

Examples:

```sh
beeper completion
```

### `beeper plugins`
Manage Beeper CLI plugins

```sh
beeper plugins
```

Examples:

```sh
beeper plugins
beeper plugins install @beeper/cli-plugin-cloudflare
```

### `beeper plugins available`
List recommended optional Beeper CLI plugins

```sh
beeper plugins available
```

Examples:

```sh
beeper plugins available
beeper plugins available --json
```

### `beeper update`
Check and install Beeper updates

```sh
beeper update
```

Examples:

```sh
beeper update --check
beeper update --cli
beeper update --server
```

### `beeper config get`
Print CLI configuration

```sh
beeper config get
```

Examples:

```sh
beeper config get
beeper config get defaultTarget
```

### `beeper config set`
Set a CLI configuration value

```sh
beeper config set
```

Examples:

```sh
beeper config set defaultTarget work
```

### `beeper config path`
Print the CLI config path

```sh
beeper config path
```

Examples:

```sh
beeper config path
```

### `beeper config reset`
Reset CLI configuration

```sh
beeper config reset
```

Examples:

```sh
beeper config reset
```

### `beeper api get`
Call a raw Desktop API GET path

```sh
beeper api get
```

Examples:

```sh
beeper api get /v1/info
beeper api get /v1/chats --json
```

### `beeper api post`
Call a raw Desktop API POST path with a JSON body

```sh
beeper api post
```

Examples:

```sh
beeper api post /v1/chats/abc/read --body '{"messageID":"x"}'
```

### `beeper api request`
Call a raw Desktop API path with any supported HTTP method

```sh
beeper api request
```

Examples:

```sh
beeper api request DELETE /v1/chats/abc/messages/def/reactions --body '{"reactionKey":"👍"}'
```

## Publishing

Beeper CLI releases are built as Homebrew archives and uploaded to GitHub
Releases. Push a `v*` tag to run `.github/workflows/publish-release.yml`.

The release workflow:

- runs the Bun test suite
- builds standalone Bun binaries and Homebrew archives
- uploads the archive to the GitHub release
- updates `beeper/homebrew-tap` with the pinned archive SHA

Required repository secrets:

- `HOMEBREW_TAP_GITHUB_TOKEN`
