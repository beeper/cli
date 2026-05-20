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

Command manual: `beeper man`

## Features

- **Connects to your Beeper.** Local Beeper Desktop on this machine (default), a Beeper Server you install and manage via the CLI, or a remote Beeper Desktop or Beeper Server authorized over OAuth/PKCE — or a bearer token in CI.
- **Setup that does the work.** `beeper setup --local` adopts the signed-in Desktop session on this machine. `--server --install --yes` installs and starts a headless server. `--oauth` opens the browser. `--remote URL` authorizes the remote target.
- **Every chat, every network.** List, search, start, archive, pin, mute, rename, focus. Read, edit, delete, react. Send text, files, stickers, voice, typing indicators. Download media. Export to JSON.
- **Verification first-class.** SAS/QR device verification, recovery-key unlock, `status`/`doctor` to reach an encrypted-ready target — without leaving the shell.
- **Agent-shaped automation.** `--json` everywhere, NDJSON `--events`, WebSocket `watch`, `rpc` over stdin/stdout, and local command manifests.
- **Safe by default.** `--read-only` rejects every mutating command. Writes stay explicit.

## Install

### Homebrew (recommended)

```sh
brew install beeper/tap/cli
```

The installed command is `beeper`.

### Build from source

This repo is a Go module. From the repo root:

```sh
make check
bin/beeper --help
```

For a build only:

```sh
make build
```

For tests only:

```sh
make test
```

## Quick start

The happy path: Beeper Desktop is already on this machine. `beeper setup --local`
adopts the signed-in local session from Desktop's data directory.

```text
$ beeper setup --local
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
iMessage chat ID, an exact title, or search text. Ambiguous matches print
numbered choices; pass `--pick N` to select one in scripts.

## Connecting a target

A *target* is the Beeper endpoint `beeper` talks to — local Beeper Desktop,
local Beeper Server, or a remote Beeper Desktop or Beeper Server. Pick one of
four paths.

### 1. Local Beeper Desktop (default, recommended)

If Beeper Desktop is installed and signed in here, `beeper setup --local`
imports the existing session token from Desktop's local state. `beeper setup`
without auth flags reports the selected target's readiness.

```text
$ beeper setup --desktop --install --yes
▎ Installed   Beeper Desktop (stable)
▎ Launched    Beeper Desktop
  next        Sign in to Beeper Desktop, then re-run `beeper setup`.

$ beeper setup --local
▎ Connected   desktop
  accounts    whatsapp, telegram
```

Variant: `beeper targets start desktop` starts a managed Desktop target where the platform supports it.

### 2. Local Beeper Server (self-hosted, managed by the CLI)

For a headless long-running setup on this machine, install and adopt a local
Beeper Server. The CLI manages the process — `targets start/stop/restart/logs/enable`.

```text
$ beeper setup --server --install --yes
▎ Installed   Beeper Server (stable)
▎ Started     server on http://127.0.0.1:23373
  next        Run `beeper setup --oauth -t server` or `beeper setup --email you@example.com -t server`.

$ beeper accounts add
? Which bridge?  whatsapp
  Scan this QR code with WhatsApp on your phone:
    ▄▄▄▄▄▄▄  ▄ ▄  ▄▄▄▄▄▄▄
    █ ███ █  ▄█▄  █ ███ █
    █ ███ █  ▀█▀  █ ███ █
    ▀▀▀▀▀▀▀  ▀ ▀  ▀▀▀▀▀▀▀
▎ Connected   whatsapp · +1•••4242
```

Variants: `beeper targets add server`, `beeper targets start server`, and `beeper targets status server`.

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

Variants: `beeper setup --oauth` (PKCE against the selected target);
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

| Topic | Commands |
| --- | --- |
| **Setup** | `setup` · `verify` · `status` · `doctor` · `auth status` |
| **Targets** | `targets list` · `targets add desktop` · `targets add server` · `targets add remote` · `targets use` · `targets status` |
| **Bridges + accounts** | `bridges list` · `bridges show` · `accounts list` · `accounts add` · `accounts show` · `accounts use` |
| **Chats** | `chats list` · `chats search` · `chats show` · `chats start` · `chats archive` · `chats pin` · `chats mute` · `chats priority` · `chats remind` · `chats rename` · `chats draft` · `chats focus` |
| **Messages** | `messages list` · `messages search` · `messages export` · `send text` · `send file` · `send sticker` · `send voice` · `send react` · `presence` |
| **Contacts + media** | `contacts list` · `contacts search` · `media download` · `export` |
| **Automation** | `watch` · `rpc` · `man` |
| **Maintenance** | `update` · `config` · `completion` · `version` |

Use `beeper man` to print the local command manual.

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
Errors are written to stderr. Successful `--json` output uses
`{"success":true,"data":...,"error":null}` on stdout.

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

`man` prints a compact command manifest for tools and agents.
`rpc` runs newline-delimited JSON command RPC over stdin/stdout.

## Full command reference

For terminal-side reference, `beeper man` prints the command tree locally.

## Inspiration

- [wacli](https://wacli.sh/) — scriptable WhatsApp CLI whose command-line product shape we borrow from.

## License

MIT — see [`LICENSE`](LICENSE).
