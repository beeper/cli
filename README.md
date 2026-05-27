# beeper — One CLI for all your chats

> Built for you and your agent. Batteries included.

Talks to Beeper Desktop on this machine, to a Beeper Server you self-host, or
to either one running somewhere else. Send and receive across the chat
networks Beeper bridges, from one CLI shaped for scripts, agents, and humans
in a hurry.

**Supported chat networks** (via Beeper's bridges):
WhatsApp · iMessage · Telegram · Discord · Signal · Instagram DMs ·
Facebook Messenger · X (Twitter) DMs · LinkedIn · Slack ·
Google Messages (RCS/SMS) · Google Chat · Matrix · IRC · Bluesky.
Run `beeper bridges list` for the live list on your target.

Command manual: `beeper man` · CLI docs: `beeper docs`

## Features

- **Connects to your Beeper.** Local Beeper Desktop on this machine (default), a Beeper Server you install and manage via the CLI, or a remote Beeper Desktop or Beeper Server authorized over OAuth/PKCE — or a bearer token in CI.
- **Setup that does the work.** `beeper setup` finds Beeper Desktop, offers to launch it, adopts the session. `--server --install` installs and starts a headless server in one step. `--oauth` opens the browser. `--remote URL` does the rest.
- **Every chat, every network.** List, search, start, archive, pin, mute, rename, focus. Read, edit, delete, react. Send text, files, stickers, voice, typing indicators. Download media. Export to JSON or Markdown.
- **Verification first-class.** SAS/QR device verification, recovery-key unlock, `status`/`doctor` to reach an encrypted-ready target — without leaving the shell.
- **Agent-shaped automation.** `--json` everywhere, NDJSON `--events`, `watch` with WebSocket + outbound HMAC-signed webhooks, `rpc` over stdin/stdout, `man --json` tool manifests, raw `api get`/`post`/`request` for Beeper Client API endpoints we haven't wrapped yet.
- **Safe by default.** `--read-only` rejects every mutating command. Writes stay explicit. Plugins extend the CLI without forking it.

## Install

### Homebrew (recommended)

```sh
brew install beeper/tap/cli
```

The installed command is `beeper`.

### npm

```sh
npx beeper-cli --help
npm install -g beeper-cli
```

The package name is `beeper-cli`; the installed command is `beeper`.

### Build from source

This repo is a Bun workspace. From the repo root:

```sh
bun install
bun --filter @beeper/cli run build
bun --filter @beeper/cli run dev -- --help
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

The happy path: Beeper Desktop is already on this machine. `beeper setup` finds
it, offers to launch it if it's not running, and adopts the session.

```text
$ beeper setup
Looking for Beeper Desktop… found, not running.
Launch it now? [Y/n] y
▎ Launched   Beeper Desktop
  next       Run `beeper setup` again once it finishes starting.

$ beeper setup
Use this Desktop session for CLI access? [Y/n] y
▎ Connected  desktop
  accounts   whatsapp, telegram, imessage
  endpoint   http://127.0.0.1:23373

$ beeper chats list --limit 3
  10313  Family             3 unread
   8951  Alice              ·
   7204  Eng standup        12 unread

$ beeper messages search "flight"
   8951  Alice    · "your flight is at 6:40, gate B23"   2d ago
  10313  Family   · "what flight are you on?"            1w ago

$ beeper send text --to Family --message "on my way"
▎ Sent       Family
  message    "on my way"
  at         2026-05-18T14:02:11Z

$ beeper export --out ./beeper-export
▎ Exported   ./beeper-export
  chats      214   messages   38,901   attachments 1,205
```

Recipients accept a numeric local chat ID, a full Beeper/Matrix chat ID, an
iMessage chat ID, an exact title, or search text. Ambiguous matches prompt in a
TTY; pass `--pick N` in scripts.

## Connecting a target

A *target* is the Beeper endpoint `beeper` talks to — local Beeper Desktop,
local Beeper Server, or a remote Beeper Desktop or Beeper Server. Pick one of
four paths.

### 1. Local Beeper Desktop (default, recommended)

If Beeper Desktop is installed and signed in here, `beeper setup` discovers it
on `http://127.0.0.1:23373` and adopts the existing session. If it's installed
but not running, `setup` offers to launch it. If it's not installed at all,
`--install` does that in one step.

```text
$ beeper setup --desktop --install
▎ Installed   Beeper Desktop (stable)
▎ Launched    Beeper Desktop
  next        Sign in to Beeper Desktop, then re-run `beeper setup`.

$ beeper setup
▎ Connected   desktop
  accounts    whatsapp, telegram
```

Variants: `beeper setup --local` to skip discovery and force the local path;
`beeper install desktop --channel nightly` for the nightly channel.

### 2. Local Beeper Server (self-hosted, managed by the CLI)

For a headless long-running setup on this machine, install and adopt a local
Beeper Server. The CLI manages the process — `targets start/stop/restart/logs/enable`.

```text
$ beeper setup --server --install
▎ Installed   Beeper Server (stable)
▎ Started     server on http://127.0.0.1:23373
  auth        Opening browser to authorize this server…
▎ Connected   server
  accounts    (none)
  next        Run `beeper accounts add` to connect a network.

$ beeper accounts add
? Which bridge?  whatsapp
  Scan this QR code with WhatsApp on your phone:
    ▄▄▄▄▄▄▄  ▄ ▄  ▄▄▄▄▄▄▄
    █ ███ █  ▄█▄  █ ███ █
    █ ███ █  ▀█▀  █ ███ █
    ▀▀▀▀▀▀▀  ▀ ▀  ▀▀▀▀▀▀▀
▎ Connected   whatsapp · +1•••4242
```

Variants: `beeper install server`, `beeper install server --server-env staging`.

#### Headless server (no browser)

On a VPS or machine without a graphical environment, use the email-based auth
flow instead of OAuth:

```text
$ beeper setup --server --install
▎ Installed   Beeper Server (stable)
▎ Started     server on http://127.0.0.1:23374

$ beeper auth email start --email you@example.com -t server
  setupRequestID  20260527…-a76ef169-…

$ beeper auth email response --code 570056 --setup-request-id 20260527…-a76ef169-… -t server --yes
▎ Not ready  needs verification

$ beeper verify recovery-key -t server --key "XXXX-XXXX-XXXX-…"
▎ Ready       server
  endpoint    http://127.0.0.1:23374

$ beeper targets enable server
Enabled target at login
```

See [setup — Headless server setup](packages/cli/docs/setup.md#headless-server-setup) for details.

### 3. Remote Desktop or Server via OAuth (PKCE)

For a Beeper Desktop or Server running on another machine, authorize the CLI
through a browser-based OAuth/PKCE flow.

```text
$ beeper setup --remote https://desktop.example.com
▎ Authorizing  https://desktop.example.com
  flow         OAuth (PKCE) — opening browser…
▎ Connected    remote (desktop.example.com)
  accounts     whatsapp, telegram, signal
```

Variants: `beeper setup --oauth` (PKCE against the default Beeper auth);
`beeper targets add remote work https://desktop.example.com --default` to
register additional remotes.

### 4. Bearer token (non-interactive / CI)

For agents, CI, and scripts, hand the CLI a bearer token directly — no
browser, no interactive prompts.

```sh
BEEPER_ACCESS_TOKEN=... beeper chats list --json
BEEPER_ACCESS_TOKEN=... BEEPER_DESKTOP_BASE_URL=https://desktop.example.com \
  beeper messages list --chat 10313 --json
```

Once connected, `beeper accounts add` walks each chat-network bridge through
its own login — QR, code, OAuth, cookie, whatever the bridge requires — so
WhatsApp, Telegram, Discord, iMessage, and the rest show up under `accounts list`.

## Documentation

| Topic | Page | Commands |
| --- | --- | --- |
| **Setup + install** | [setup](docs/setup.md) · [auth](docs/auth.md) | `setup` · `install desktop` · `install server` · `verify` · `status` · `doctor` · `auth status` |
| **Targets** | [targets](docs/targets.md) | `targets list` · `targets add desktop` · `targets add server` · `targets add remote` · `targets use` · `targets status` · `targets logs` |
| **Bridges + accounts** | [accounts](docs/accounts.md) | `bridges list` · `bridges show` · `accounts list` · `accounts add` · `accounts show` · `accounts use` · `accounts remove` |
| **Chats** | [chats](docs/chats.md) | `chats list` · `chats search` · `chats show` · `chats start` · `chats archive` · `chats pin` · `chats mute` · `chats priority` · `chats remind` · `chats rename` · `chats draft` · `chats focus` |
| **Messages** | [messages](docs/messages.md) · [send](docs/send.md) · [presence](docs/presence.md) | `messages list` · `messages search` · `messages export` · `send text` · `send file` · `send sticker` · `send voice` · `send react` · `presence` |
| **Contacts + media** | [contacts](docs/contacts.md) · [media](docs/media.md) · [export](docs/export.md) | `contacts list` · `contacts search` · `media download` · `export` |
| **Automation** | [watch](docs/watch.md) · [rpc](docs/rpc.md) · [api](docs/api.md) | `watch` · `watch --webhook` · `rpc` · `man` · `api get` · `api post` · `api request` |
| **Maintenance** | [config](docs/config.md) · [update](docs/update.md) | `update` · `config` · `completion` · `docs` · `version` |

Use `beeper docs` to open the CLI docs and `beeper man` to print the local
command manual.

## Configuration

Default Beeper Client API target: `http://127.0.0.1:23373`. CLI configuration is
stored under your user config dir; print it with `beeper config path`.

**Global flags:** `--base-url`, `--target`, `--json`, `--events`,
`--full`, `--timeout`, `--read-only`, `--debug`, `--yes`, `--quiet`.

**Environment overrides:**

| Variable | Effect |
| --- | --- |
| `BEEPER_ACCESS_TOKEN` | Bearer token for the selected target. Overrides stored OAuth login. |
| `BEEPER_DESKTOP_BASE_URL` | Beeper Client API base URL (Desktop or Server). Defaults to `http://127.0.0.1:23373`. |
| `BEEPER_READONLY` | `1`/`true`/`yes`/`on` enables read-only mode globally. |
| `BEEPER_CLI_CONFIG_DIR` | Override config directory for testing or isolated profiles. |

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success. |
| `1` | Generic runtime error. |
| `2` | Usage error (parsing, validation, missing required flag/arg, read-only refusal). |
| `3` | Auth required (no stored token; sign in or set `BEEPER_ACCESS_TOKEN`). |
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

Raw Beeper Client API calls live under `api`, so scripts can reach a new
endpoint before a workflow command exists:

```sh
beeper api get /v1/info
beeper api post /v1/messages/{chatID}/send --body '{"text":"hello"}'
beeper api request DELETE /v1/chats/abc/messages/def/reactions --body '{"reactionKey":"👍"}'
```

## Plugins

Beeper CLI supports optional oclif plugins. List recommended Beeper plugins:

```sh
beeper plugins available
```

Install a published plugin:

```sh
beeper plugins install @beeper/cli-plugin-cloudflare
```

For plugin development, import from `@beeper/cli/plugin-sdk` and expose oclif
commands from your package. Link a local plugin while working on it:

```sh
beeper plugins link ./packages/cli-plugin-cloudflare
beeper targets tunnel --help
```

First-party optional plugins:

| Package | Adds |
| --- | --- |
| `@beeper/cli-plugin-cloudflare` | `targets tunnel` for exposing a selected Beeper target through Cloudflare Tunnel. |


## Full command reference

The complete `beeper` command summary and per-command reference (every flag,
arg, and example) lives in [`packages/cli/README.md`](packages/cli/README.md).
For terminal-side reference, `beeper man` prints the same manual locally and
`beeper man --json` emits a tool manifest for agents.

## Inspiration

- [wacli](https://wacli.sh/) — scriptable WhatsApp CLI whose command-line product shape we borrow from.

## License

MIT — see [`packages/cli/LICENSE`](packages/cli/LICENSE).
