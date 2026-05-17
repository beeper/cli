# Beeper CLI - Beeper from your terminal

A scriptable Beeper client for people and agents. It talks to a local Beeper
Desktop API or a configured Beeper Server target, then gives you setup,
account management, chat search, message reading, sending, media downloads,
exports, diagnostics, and raw API access from the command line.

> Requires a running Beeper Desktop API or a configured Beeper Server target.

Command manual: `beeper man`

## Features

- **Setup + readiness** - `setup`, `status`, `doctor`, and verification commands guide a target from login through encrypted-message readiness.
- **Targets** - use local Desktop, managed Desktop, managed Server, or remote Beeper targets with one selected default.
- **Accounts** - list connected networks, add accounts, switch defaults, inspect details, and remove accounts.
- **Chats + contacts** - list, search, start, archive, pin, mute, mark, rename, and inspect chats across accounts.
- **Messages + media** - list, search, show, edit, delete, react, send text/files, and download message media.
- **Exports** - write accounts, chats, messages, Markdown transcripts, HTML transcripts, and attachments to disk.
- **Automation** - `--json` everywhere, NDJSON `--events`, `rpc` over stdin/stdout, and `man --json` for tool manifests.
- **Safety** - `--read-only` rejects mutating commands, while raw API access remains explicit under `api get` and `api post`.

## Install

### Homebrew

```sh
brew install beeper/tap/beeper-cli
```

The installed command is `beeper`.

### Build from source

Install dependencies before running these commands.

```sh
pnpm --filter beeper-cli build
pnpm --filter beeper-cli dev -- --help
```

For local CLI development inside `packages/cli`:

```sh
pnpm dev -- --help
```

Regenerate this README after command, flag, or argument changes:

```sh
pnpm readme
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
beeper chats list

# 4. Read and search messages
beeper messages list --chat "Family" --limit 50
beeper messages search "flight"

# 5. Send
beeper send text --to "Family" --message "on my way"
beeper send file --to "Family" --file ./photo.jpg --caption "from today"

# 6. Export
beeper export --out ./beeper-export
```

`beeper setup` makes the selected target ready. It is safe to run again: the
command inspects the current target state and continues from login, device
verification, recovery-key, first-sync, or ready states.

For non-interactive use, pass a token through the environment:

```sh
BEEPER_ACCESS_TOKEN=... beeper chats --json
```

## Documentation

| Area | Commands |
| --- | --- |
| **Setup** | `setup` · `doctor` · `status` · `auth status` · `verify` |
| **Targets** | `targets list` · `targets use` · `targets status` · `targets logs` |
| **Accounts** | `accounts list` · `accounts add` · `accounts show` · `accounts remove` |
| **Messaging** | `chats list` · `messages list` · `send text` · `send file` · `media download` |
| **Contacts** | `contacts list` · `contacts search` · `contacts show` |
| **Automation** | `watch` · `rpc` · `man` · `api get` · `api post` |
| **Maintenance** | `install desktop` · `install server` · `update` · `config` · `completion` |

Use `beeper docs` to open the CLI docs and `beeper man` to print the local
command manual.

## Configuration

Default Desktop API target: `http://127.0.0.1:23373`.

**Global flags:** `--base-url`, `--target`, `--json`, `--events`,
`--full`, `--timeout`, `--read-only`, `--debug`, `--yes`.

**Environment overrides:**

| Variable | Effect |
| --- | --- |
| `BEEPER_ACCESS_TOKEN` | Bearer token. Overrides stored OAuth login. |
| `BEEPER_DESKTOP_BASE_URL` | Beeper Desktop API base URL. Defaults to `http://127.0.0.1:23373`. |
| `BEEPER_BASE_URL` | SDK-compatible base URL fallback. |
| `BEEPER_CLI_CONFIG_DIR` | Override config directory for testing or isolated profiles. |

## Addressing

- Chat arguments accept Beeper chat IDs, local chat IDs, exact titles, or search text.
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
| `setup` | Make the selected target ready |
| `targets list` | List Beeper targets |
| `targets create desktop` | Create a managed Desktop target |
| `targets create server` | Create a managed Server target |
| `targets add remote` | Add a remote Beeper target |
| `targets use` | Set the default target |
| `targets show` | Show target details |
| `targets status` | Check target reachability |
| `targets start` | Start a managed target |
| `targets stop` | Stop a managed target |
| `targets restart` | Restart a managed target |
| `targets logs` | Print managed target logs |
| `targets enable` | Start a managed target at login |
| `targets disable` | Stop starting a managed target at login |
| `targets remove` | Remove a target |
| `auth status` | Show local auth status and token metadata |
| `auth logout` | Clear stored authentication |
| `verify` | Continue device verification |
| `verify status` | Show encryption readiness |
| `verify approve` | Approve a verification request |
| `verify recovery-key` | Unlock encrypted messages with a recovery key |
| `verify reset-recovery-key` | Create a new recovery key |
| `verify cancel` | Cancel device verification |
| `verify list` | List active verification work |
| `verify start` | Start device verification |
| `verify show` | Show active verification details |
| `verify sas` | Start emoji verification |
| `verify sas confirm` | Confirm emoji verification |
| `verify qr scan` | Submit a scanned QR payload |
| `verify qr confirm-scanned` | Confirm a QR scan |
| `accounts list` | List connected accounts |
| `accounts add` | Add a Beeper account |
| `accounts show` | Show account details |
| `accounts remove` | Remove an account |
| `accounts use` | Select an account |
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
| `chats mark-read` | Mark a chat read |
| `chats mark-unread` | Mark a chat unread |
| `chats low-priority` | Move a chat to Low Priority |
| `chats inbox` | Move a chat to the inbox |
| `chats notify-anyway` | Notify a muted chat |
| `chats title` | Set a chat title |
| `chats description` | Set a chat description |
| `chats avatar` | Set a chat avatar |
| `chats draft` | Set a chat draft |
| `chats clear-draft` | Clear a chat draft |
| `chats expiry` | Set disappearing-message expiry |
| `chats remind` | Set a chat reminder |
| `chats unremind` | Clear a chat reminder |
| `chats focus` | Focus Beeper Desktop |
| `messages list` | List chat messages |
| `messages search` | Search messages across chats. |
| `messages show` | Show one message |
| `messages context` | Show message context |
| `messages edit` | Edit a message |
| `messages delete` | Delete a message |
| `messages react` | React to a message |
| `messages unreact` | Remove a reaction |
| `send text` | Send text |
| `send file` | Send a file |
| `contacts list` | List merged contacts for a specific account with cursor-based pagination. |
| `contacts search` | Search contacts on a specific account using merged account contacts, network search, and exact identifier lookup. |
| `contacts show` | Show contact details |
| `media download` | Download message media |
| `export` | Export accounts, chats, messages, Markdown transcripts, and attachments. |
| `watch` | Stream Desktop API WebSocket events |
| `rpc` | Run newline-delimited JSON command RPC |
| `man` | Print the command manual |
| `doctor` | Check target readiness |
| `status` | Show target status |
| `docs` | Open Beeper CLI docs |
| `version` | Print CLI version |
| `completion` | Print shell completion help |
| `install desktop` | Install Beeper Desktop |
| `install server` | Install Beeper Server locally |
| `update` | Check and install Beeper updates |
| `config get` | Print CLI configuration |
| `config set` | Set a CLI configuration value |
| `config path` | Print the CLI config path |
| `config reset` | Reset CLI configuration |
| `api get` | Call a raw Desktop API GET path |
| `api post` | Call a raw Desktop API POST path with a JSON body |

## Command Reference

### `beeper setup`
Make the selected target ready

```sh
beeper setup
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--install` | boolean | Allow installing missing managed runtime |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper targets list`
List Beeper targets

```sh
beeper targets list
```

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper targets create desktop`
Create a managed Desktop target

```sh
beeper targets create desktop [name]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `name` | no |  |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--default` | boolean |  |
| `--port=<value>` | option |  |
| `--server-env=<production|staging>` | option | Default: production |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper targets create server`
Create a managed Server target

```sh
beeper targets create server [name]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `name` | no |  |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--default` | boolean |  |
| `--port=<value>` | option |  |
| `--server-env=<production|staging>` | option | Default: production |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper targets add remote`
Add a remote Beeper target

```sh
beeper targets add remote <name> <url>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `name` | yes |  |
| `url` | yes |  |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--default` | boolean |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper targets use`
Set the default target

```sh
beeper targets use <name>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `name` | yes |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper targets show`
Show target details

```sh
beeper targets show [name]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `name` | no |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper targets status`
Check target reachability

```sh
beeper targets status [name]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `name` | no |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper targets start`
Start a managed target

```sh
beeper targets start [name]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `name` | no |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper targets stop`
Stop a managed target

```sh
beeper targets stop [name]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `name` | no |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper targets restart`
Restart a managed target

```sh
beeper targets restart [name]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `name` | no |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper targets logs`
Print managed target logs

```sh
beeper targets logs [name]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `name` | no |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper targets enable`
Start a managed target at login

```sh
beeper targets enable [name]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `name` | no |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper targets disable`
Stop starting a managed target at login

```sh
beeper targets disable [name]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `name` | no |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper targets remove`
Remove a target

```sh
beeper targets remove <name>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `name` | yes |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper auth status`
Show local auth status and token metadata

```sh
beeper auth status
```

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper auth logout`
Clear stored authentication

```sh
beeper auth logout
```

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper verify`
Continue device verification

```sh
beeper verify
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--user=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper verify status`
Show encryption readiness

```sh
beeper verify status
```

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper verify approve`
Approve a verification request

```sh
beeper verify approve
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--code=<value>` | option |  |
| `--id=<value>` | option |  |
| `--payload=<value>` | option |  |
| `--user=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper verify recovery-key`
Unlock encrypted messages with a recovery key

```sh
beeper verify recovery-key
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--code=<value>` | option |  |
| `--id=<value>` | option |  |
| `--payload=<value>` | option |  |
| `--user=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper verify reset-recovery-key`
Create a new recovery key

```sh
beeper verify reset-recovery-key
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--code=<value>` | option |  |
| `--id=<value>` | option |  |
| `--payload=<value>` | option |  |
| `--user=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper verify cancel`
Cancel device verification

```sh
beeper verify cancel
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--code=<value>` | option |  |
| `--id=<value>` | option |  |
| `--payload=<value>` | option |  |
| `--user=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper verify list`
List active verification work

```sh
beeper verify list
```

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper verify start`
Start device verification

```sh
beeper verify start
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--code=<value>` | option |  |
| `--id=<value>` | option |  |
| `--payload=<value>` | option |  |
| `--user=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper verify show`
Show active verification details

```sh
beeper verify show
```

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper verify sas`
Start emoji verification

```sh
beeper verify sas
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--id=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper verify sas confirm`
Confirm emoji verification

```sh
beeper verify sas confirm
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--id=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper verify qr scan`
Submit a scanned QR payload

```sh
beeper verify qr scan
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--id=<value>` | option |  |
| `--payload=<value>` | option | Required. |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper verify qr confirm-scanned`
Confirm a QR scan

```sh
beeper verify qr confirm-scanned
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--id=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper accounts list`
List connected accounts

```sh
beeper accounts list
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--account=<value>...` | option | Filter by account selector |
| `--ids` | boolean |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

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

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper accounts show`
Show account details

```sh
beeper accounts show <account>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `account` | yes |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper accounts remove`
Remove an account

```sh
beeper accounts remove <account>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `account` | yes |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper accounts use`
Select an account

```sh
beeper accounts use <account>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `account` | yes |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats list`
List chats

```sh
beeper chats list
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--account=<value>...` | option |  |
| `--ids` | boolean |  |
| `--limit=<value>` | option | Default: 20 |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats search`
Search chats

```sh
beeper chats search <query>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `query` | yes |  |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--account=<value>...` | option |  |
| `--ids` | boolean |  |
| `--limit=<value>` | option | Default: 20 |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats show`
Show chat details

```sh
beeper chats show
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--max-participants=<value>` | option |  |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats start`
Start a chat

```sh
beeper chats start <user>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `user` | yes |  |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--account=<value>` | option |  |
| `--title=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats archive`
Archive a chat

```sh
beeper chats archive
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats unarchive`
Unarchive a chat

```sh
beeper chats unarchive
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats pin`
Pin a chat

```sh
beeper chats pin
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats unpin`
Unpin a chat

```sh
beeper chats unpin
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats mute`
Mute a chat

```sh
beeper chats mute
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--duration=<value>` | option | Mute duration, such as 8h |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats unmute`
Unmute a chat

```sh
beeper chats unmute
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats mark-read`
Mark a chat read

```sh
beeper chats mark-read
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--message=<value>` | option |  |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats mark-unread`
Mark a chat unread

```sh
beeper chats mark-unread
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--message=<value>` | option |  |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats low-priority`
Move a chat to Low Priority

```sh
beeper chats low-priority
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats inbox`
Move a chat to the inbox

```sh
beeper chats inbox
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats notify-anyway`
Notify a muted chat

```sh
beeper chats notify-anyway
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats title`
Set a chat title

```sh
beeper chats title
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--pick=<value>` | option |  |
| `--title=<value>` | option | Required. |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats description`
Set a chat description

```sh
beeper chats description
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--clear` | boolean |  |
| `--description=<value>` | option |  |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats avatar`
Set a chat avatar

```sh
beeper chats avatar
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--clear` | boolean |  |
| `--file=<value>` | option |  |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats draft`
Set a chat draft

```sh
beeper chats draft
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--file=<value>` | option |  |
| `--file-name=<value>` | option |  |
| `--mime-type=<value>` | option |  |
| `--pick=<value>` | option |  |
| `--text=<value>` | option | Required. |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats clear-draft`
Clear a chat draft

```sh
beeper chats clear-draft
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats expiry`
Set disappearing-message expiry

```sh
beeper chats expiry
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--pick=<value>` | option |  |
| `--seconds=<value>` | option | Required. |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats remind`
Set a chat reminder

```sh
beeper chats remind
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--dismiss-on-message` | boolean |  |
| `--pick=<value>` | option |  |
| `--when=<value>` | option | Required. |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats unremind`
Clear a chat reminder

```sh
beeper chats unremind
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper chats focus`
Focus Beeper Desktop

```sh
beeper chats focus
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--attachment=<value>` | option |  |
| `--chat=<value>` | option | Required. |
| `--draft=<value>` | option |  |
| `--message=<value>` | option |  |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper messages list`
List chat messages

```sh
beeper messages list
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--after=<value>` | option |  |
| `--before=<value>` | option |  |
| `--chat=<value>` | option | Required. |
| `--ids` | boolean |  |
| `--limit=<value>` | option | Default: 50 |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

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
| `--chat-type=<group|single>` | option | Limit to group chats or direct messages |
| `--date-after=<value>` | option | Only messages after this ISO timestamp |
| `--date-before=<value>` | option | Only messages before this ISO timestamp |
| `--exclude-low-priority` | boolean | Exclude low-priority chats. Use --no-exclude-low-priority to include all. |
| `--ids` | boolean | Print only message IDs |
| `--include-muted` | boolean | Include muted chats. Use --no-include-muted for a tighter search. |
| `--limit=<value>` | option | Maximum messages to print Default: 50 |
| `--media=<any|video|image|link|file>...` | option | Filter by media type. Repeat for more types. |
| `--sender=<value>` | option | me, others, or a user ID |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper messages show`
Show one message

```sh
beeper messages show
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--id=<value>` | option | Required. |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper messages context`
Show message context

```sh
beeper messages context
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--after=<value>` | option | Default: 10 |
| `--before=<value>` | option | Default: 10 |
| `--chat=<value>` | option | Required. |
| `--id=<value>` | option | Required. |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper messages edit`
Edit a message

```sh
beeper messages edit
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--id=<value>` | option | Required. |
| `--message=<value>` | option | Required. |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper messages delete`
Delete a message

```sh
beeper messages delete
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--for-everyone` | boolean |  |
| `--id=<value>` | option | Required. |
| `--pick=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper messages react`
React to a message

```sh
beeper messages react
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--id=<value>` | option | Required. |
| `--pick=<value>` | option |  |
| `--reaction=<value>` | option | Required. |
| `--transaction=<value>` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper messages unreact`
Remove a reaction

```sh
beeper messages unreact
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--chat=<value>` | option | Required. |
| `--id=<value>` | option | Required. |
| `--pick=<value>` | option |  |
| `--reaction=<value>` | option | Required. |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper send text`
Send text

```sh
beeper send text
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--message=<value>` | option | Required. |
| `--pick=<value>` | option |  |
| `--reply-to=<value>` | option |  |
| `--to=<value>` | option | Required. |
| `--wait` | boolean |  |
| `--wait-interval=<value>` | option | Default: 750 |
| `--wait-timeout=<value>` | option | Default: 30000 |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper send file`
Send a file

```sh
beeper send file
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--caption=<value>` | option |  |
| `--file=<value>` | option | Required. |
| `--file-name=<value>` | option |  |
| `--mime-type=<value>` | option |  |
| `--pick=<value>` | option |  |
| `--reply-to=<value>` | option |  |
| `--to=<value>` | option | Required. |
| `--wait` | boolean |  |
| `--wait-interval=<value>` | option | Default: 750 |
| `--wait-timeout=<value>` | option | Default: 30000 |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper contacts list`
List merged contacts for a specific account with cursor-based pagination.

```sh
beeper contacts list
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--account=<value>...` | option | Limit to Account ID, network, bridge, or account user |
| `--ids` | boolean | Print only contact user IDs |
| `--limit=<value>` | option | Maximum contacts to print Default: 50 |
| `--query=<value>` | option | Optional blended contact lookup query |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

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

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper contacts show`
Show contact details

```sh
beeper contacts show <contact>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `contact` | yes |  |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--account=<value>...` | option |  |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper media download`
Download message media

```sh
beeper media download <url>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `url` | yes |  |

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--out=<value>` | option | Default: . |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

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

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper watch`
Stream Desktop API WebSocket events

```sh
beeper watch
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `-c, --chat=<value>...` | option | Chat ID to subscribe to. Defaults to all chats. |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper rpc`
Run newline-delimited JSON command RPC

```sh
beeper rpc
```

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper man`
Print the command manual

```sh
beeper man
```

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper doctor`
Check target readiness

```sh
beeper doctor
```

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper status`
Show target status

```sh
beeper status
```

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper docs`
Open Beeper CLI docs

```sh
beeper docs
```

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper version`
Print CLI version

```sh
beeper version
```

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper completion`
Print shell completion help

```sh
beeper completion
```

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper install desktop`
Install Beeper Desktop

```sh
beeper install desktop
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--channel=<stable|nightly>` | option | Desktop release channel Default: stable |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper install server`
Install Beeper Server locally

```sh
beeper install server
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--channel=<stable|nightly>` | option | Server release channel Default: stable |
| `--server-env=<production|staging>` | option | Server environment. Staging forces nightly. Default: production |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper update`
Check and install Beeper updates

```sh
beeper update
```

Flags:

| Flag | Type | Description |
| --- | --- | --- |
| `--check` | boolean | Only check for updates; do not install |
| `--cli` | boolean | Check the Beeper CLI package |
| `--desktop` | boolean | Check the CLI-owned Desktop install |
| `--server` | boolean | Check the CLI-owned Server install |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper config get`
Print CLI configuration

```sh
beeper config get [key]
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `key` | no | Optional config key to print |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

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

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper config path`
Print the CLI config path

```sh
beeper config path
```

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper config reset`
Reset CLI configuration

```sh
beeper config reset
```

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

### `beeper api get`
Call a raw Desktop API GET path

```sh
beeper api get <path>
```

Arguments:

| Name | Required | Description |
| --- | --- | --- |
| `path` | yes | API path, for example /v1/info |

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

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

Global flags: `--base-url`, `--target`, `--debug`, `--events`, `--full`, `--json`, `--read-only`, `--timeout`, `--yes`.

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
