#!/usr/bin/env bun
import {readFile, writeFile} from 'node:fs/promises';
import {Config} from '@oclif/core/config';
import {commandManifest} from '../dist/lib/manifest.js';

const config = await Config.load({root: process.cwd()});
const check = process.argv.includes('--check');
// Include hidden commands so manifest-listed commands still render in the README
// and pass the manifest match.
const commandsByID = new Map([...config.commands].map(command => [displayID(command.id), command]));
// Manifest entries for plugin-shipped commands (e.g. `targets tunnel` from
// @beeper/cli-plugin-cloudflare) won't be in the built oclif config unless that plugin is
// installed. Render them from the manifest entry directly instead of erroring.
const commands = commandManifest.map(item => {
  const command = commandsByID.get(item.command);
  if (command) return command;
  return {
    id: item.command.replaceAll(' ', ':'),
    summary: item.description,
    description: item.description,
    args: {},
    flags: {},
    pluginShipped: true,
  };
});

const globalFlags = new Set(['base-url', 'debug', 'events', 'full', 'json', 'quiet', 'read-only', 'target', 'timeout', 'yes']);
const commandList = commands.map(command => {
  const id = displayID(command.id);
  return `| \`${id}\` | ${escapeTable(text(command.summary || command.description || ''))} |`;
});

const examplesByID = new Map(commandManifest.map(item => [item.command, item.examples ?? []]));
const commandSections = commands.map(command => commandSection(command)).join('\n\n');

const readme = `# 💬 beeper — Beeper CLI: connect, search, send

A scriptable Beeper client for humans and agents. Drives Beeper Desktop on this
machine by default, with first-class paths for self-hosting Beeper Server and
for talking to remote Desktop or Server targets — then gives you account
management, chat search, message reading, sending, media downloads, exports,
diagnostics, and raw API access from the command line.

> Third-party-friendly: speaks the Beeper Desktop API. Pairs over the local
> loopback by default; remote targets authorize over OAuth (PKCE) or with a
> bearer token you provide.

Command manual: \`beeper man\` · CLI docs: \`beeper docs\`

## Features

- **One CLI, three targets** — local Beeper Desktop on this machine (default), a managed local Beeper Server you install via the CLI, or a remote Beeper Desktop/Server you authorize over OAuth/PKCE or with a bearer token.
- **Guided setup** — \`beeper setup\` discovers a Desktop on this device and adopts its session; \`--server --install\`, \`--desktop --install\`, \`--oauth\`, and \`--remote URL\` cover every other path.
- **Runtime installers** — \`install desktop\` and \`install server\` install and manage the local Beeper runtimes; \`targets start/stop/restart/logs/enable\` runs them.
- **Bridges + accounts** — list bridge connectors, walk login flows, connect accounts (WhatsApp, Telegram, Discord, iMessage, …), switch defaults, and remove accounts.
- **Chats, messages, contacts** — list, search, start, archive, pin, mute, rename, focus, read, edit, delete, react, send text/files/reactions/stickers/voice, send typing indicators, download media.
- **Verification + readiness** — \`verify\`, \`verify status\`, SAS/QR flows, recovery-key unlock, and \`status\`/\`doctor\` to reach an encrypted-ready target.
- **Exports** — \`export\` for full chats/transcripts/attachments and \`messages export\` for one-chat JSON.
- **Automation** — \`--json\` everywhere, NDJSON \`--events\`, \`watch\` (WS + outbound webhooks with HMAC), \`rpc\` over stdin/stdout, \`man --json\` for tool manifests.
- **Safety** — \`--read-only\` rejects mutating commands; raw API access stays explicit under \`api get\`, \`api post\`, and \`api request\`.

## Install

### Homebrew (recommended)

\`\`\`sh
brew install beeper/tap/beeper-cli
\`\`\`

The installed command is \`beeper\`.

### npm

\`\`\`sh
npx beeper-cli --help
npm install -g beeper-cli
\`\`\`

The package name is \`beeper-cli\`; the installed command is \`beeper\`.

### Build from source

This repo is a Bun workspace. From the repo root:

\`\`\`sh
bun install
bun --filter beeper-cli run build
bun --filter beeper-cli run dev -- --help
\`\`\`

For local CLI development inside \`packages/cli\`:

\`\`\`sh
bun run dev -- --help
\`\`\`

Regenerate this README after command, flag, or argument changes:

\`\`\`sh
bun run readme
\`\`\`

## Quick start

The happy path: you already run Beeper Desktop on this machine. \`beeper setup\`
will find it, adopt its session, and you're ready.

\`\`\`sh
# 1. Adopt the local Beeper Desktop session (or pick another target)
beeper setup

# 2. Check readiness
beeper status
beeper doctor

# 3. Inspect bridges and connected chat accounts
beeper bridges list
beeper accounts list

# 4. Read and search
beeper chats list
beeper messages list --chat 10313 --limit 50
beeper messages search "flight"

# 5. Send
beeper send text --to 10313 --message "on my way"
beeper send file --to 8951 --file ./photo.jpg --caption "from today"

# 6. Export
beeper export --out ./beeper-export
\`\`\`

Recipients accept a numeric local chat ID, a full Beeper/Matrix chat ID, an
iMessage chat ID, an exact title, or search text. Ambiguous matches prompt in a
TTY; pass \`--pick N\` in scripts.

## Connecting a target

A *target* is the endpoint \`beeper\` talks to. You pick one of four paths
depending on where Beeper lives.

### 1. Local Beeper Desktop (default, recommended)

If Beeper Desktop is already installed and signed in on this machine, no
configuration is required — \`beeper setup\` discovers it on the loopback Desktop
API (\`http://127.0.0.1:23373\`) and adopts the existing session.

\`\`\`sh
beeper setup            # auto-detect; offers to use the running Desktop
beeper setup --local    # force the direct local-Desktop path
\`\`\`

If Beeper Desktop is not installed, install it and configure the target in one
step, or install it directly:

\`\`\`sh
beeper setup --desktop --install
beeper install desktop                  # install only
beeper install desktop --channel nightly
\`\`\`

### 2. Local Beeper Server (self-hosted, managed by the CLI)

For a long-running headless setup on this machine, install and adopt a local
Beeper Server. The CLI manages the process (\`targets start/stop/logs/enable\`).

\`\`\`sh
beeper setup --server --install
beeper install server
beeper install server --server-env staging
\`\`\`

### 3. Remote Desktop or Server via OAuth (PKCE)

For a Beeper Desktop or Server running on another machine, authorize the CLI
through a browser-based OAuth/PKCE flow.

\`\`\`sh
beeper setup --oauth                                # PKCE against the default Beeper auth
beeper setup --remote https://desktop.example.com   # remote URL, OAuth as needed
beeper targets add remote work https://desktop.example.com --default
\`\`\`

### 4. Bearer token (non-interactive / CI)

For agents, CI, and scripts, hand the CLI a bearer token directly — no
browser, no interactive prompts.

\`\`\`sh
BEEPER_ACCESS_TOKEN=... beeper chats list --json
BEEPER_ACCESS_TOKEN=... BEEPER_DESKTOP_BASE_URL=https://desktop.example.com \\
  beeper messages list --chat 10313 --json
\`\`\`

Once connected, \`beeper accounts add\` walks each chat-network bridge through
its own login (QR, code, OAuth, cookie — whatever the bridge requires) so your
WhatsApp, Telegram, Discord, iMessage, and other accounts show up.

## Documentation

| Topic | Page | Commands |
| --- | --- | --- |
| **Setup + install** | [setup](docs/setup.md) · [auth](docs/auth.md) | \`setup\` · \`install desktop\` · \`install server\` · \`verify\` · \`status\` · \`doctor\` · \`auth status\` |
| **Targets** | [targets](docs/targets.md) | \`targets list\` · \`targets add desktop\` · \`targets add server\` · \`targets add remote\` · \`targets use\` · \`targets status\` · \`targets logs\` |
| **Bridges + accounts** | [accounts](docs/accounts.md) | \`bridges list\` · \`bridges show\` · \`accounts list\` · \`accounts add\` · \`accounts show\` · \`accounts use\` · \`accounts remove\` |
| **Chats** | [chats](docs/chats.md) | \`chats list\` · \`chats search\` · \`chats show\` · \`chats start\` · \`chats archive\` · \`chats pin\` · \`chats mute\` · \`chats priority\` · \`chats remind\` · \`chats rename\` · \`chats draft\` · \`chats focus\` |
| **Messages** | [messages](docs/messages.md) · [send](docs/send.md) · [presence](docs/presence.md) | \`messages list\` · \`messages search\` · \`messages export\` · \`send text\` · \`send file\` · \`send sticker\` · \`send voice\` · \`send react\` · \`presence\` |
| **Contacts + media** | [contacts](docs/contacts.md) · [media](docs/media.md) · [export](docs/export.md) | \`contacts list\` · \`contacts search\` · \`media download\` · \`export\` |
| **Automation** | [watch](docs/watch.md) · [rpc](docs/rpc.md) · [api](docs/api.md) | \`watch\` · \`watch --webhook\` · \`rpc\` · \`man\` · \`api get\` · \`api post\` · \`api request\` |
| **Maintenance** | [config](docs/config.md) · [update](docs/update.md) | \`update\` · \`config\` · \`completion\` · \`docs\` · \`version\` |

Use \`beeper docs\` to open the CLI docs and \`beeper man\` to print the local
command manual.

## Configuration

Default Desktop API target: \`http://127.0.0.1:23373\`. CLI configuration is
stored under your user config dir; print it with \`beeper config path\`.

**Global flags:** \`--base-url\`, \`--target\`, \`--json\`, \`--events\`,
\`--full\`, \`--timeout\`, \`--read-only\`, \`--debug\`, \`--yes\`, \`--quiet\`.

**Environment overrides:**

| Variable | Effect |
| --- | --- |
| \`BEEPER_ACCESS_TOKEN\` | Bearer token for the selected target. Overrides stored OAuth login. |
| \`BEEPER_DESKTOP_BASE_URL\` | Desktop/Server API base URL. Defaults to \`http://127.0.0.1:23373\`. |
| \`BEEPER_READONLY\` | \`1\`/\`true\`/\`yes\`/\`on\` enables read-only mode globally. |
| \`BEEPER_CLI_CONFIG_DIR\` | Override config directory for testing or isolated profiles. |

## Exit codes

| Code | Meaning |
| --- | --- |
| \`0\` | Success. |
| \`1\` | Generic runtime error. |
| \`2\` | Usage error (parsing, validation, missing required flag/arg, read-only refusal). |
| \`3\` | Auth required (no stored token; sign in or set \`BEEPER_ACCESS_TOKEN\`). |
| \`4\` | Target/account not ready (\`doctor\` reports this when readiness is not \`ready\`). |
| \`5\` | Selector matched nothing (unknown target, account, chat, contact). |
| \`6\` | Ambiguous selector (multiple matches; pass an exact ID or \`--pick N\`). |

JSON output preserves the same envelope on failure: \`{"success":false,"data":null,"error":"...","exitCode":N}\` written to stderr.

## Addressing

- Chat arguments accept numeric local chat IDs, full Beeper/Matrix chat IDs, iMessage chat IDs, exact titles, or search text.
- For scripts on the same target/profile, prefer the numeric local chat ID shown by \`beeper chats list\`; use the full Beeper/Matrix chat ID when the selector must work across targets or profiles.
- Numeric local chat IDs come from the selected Desktop database. Treat them as local to that target/profile.
- Ambiguous chat matches return numbered choices; pass \`--pick N\` to select one.
- Account arguments accept account IDs, network names, bridge type/id, or account user identity.
- Account filters can expand a network name to multiple matching accounts.
- \`contacts search\` and \`chats start\` can search across all accounts when \`--account\` is omitted.
- \`contacts list\` accepts the same account selectors as other account-scoped commands.

## Output and scripting

Most commands support:

- app-like text by default, optimized for scanning chats, messages, contacts, accounts, and media
- \`--json\` for \`{"success":true,"data":...,"error":null}\` output on stdout
- \`--events\` for NDJSON lifecycle events on stderr from long-running commands
- \`--read-only\` to reject commands that modify Beeper or local CLI state
- \`--full\` to disable truncation
- \`--debug\` for SDK debug logging
- \`--target\` or \`--base-url\` to point at a different target

\`man --json\` prints a compact command manifest for tools and agents.
\`rpc\` runs newline-delimited JSON command RPC over stdin/stdout.

## Raw API access

Raw Desktop/Server API calls live under \`api\`, so scripts can reach a new
endpoint before a workflow command exists:

\`\`\`sh
beeper api get /v1/info
beeper api post /v1/messages/{chatID}/send --body '{"text":"hello"}'
beeper api request DELETE /v1/chats/abc/messages/def/reactions --body '{"reactionKey":"👍"}'
\`\`\`

## Plugins

Beeper CLI supports optional oclif plugins. List recommended Beeper plugins:

\`\`\`sh
beeper plugins available
\`\`\`

Install a published plugin:

\`\`\`sh
beeper plugins install @beeper/cli-plugin-cloudflare
\`\`\`

For plugin development, import from \`beeper-cli/plugin-sdk\` and expose oclif
commands from your package. Link a local plugin while working on it:

\`\`\`sh
beeper plugins link ./packages/cli-plugin-cloudflare
beeper targets tunnel --help
\`\`\`

First-party optional plugins:

| Package | Adds |
| --- | --- |
| \`@beeper/cli-plugin-cloudflare\` | \`targets tunnel\` for exposing a selected Beeper target through Cloudflare Tunnel. |

## Inspiration

Shamelessly inspired by [wacli](https://wacli.sh/), a WhatsApp CLI that gets
the command-line product shape right. Beeper CLI borrows the same taste:
workflow-first commands, readable default output, boring machine output,
explicit writes, and names based on what people are trying to do.

## Command Summary

| Command | Summary |
| --- | --- |
${commandList.join('\n')}

## Command Reference

${commandSections}

## Publishing

Beeper CLI releases are built as Homebrew archives and uploaded to GitHub
Releases. Push a \`v*\` tag to run \`.github/workflows/publish-release.yml\`.

The release workflow:

- runs the Bun test suite
- builds standalone Bun binaries and Homebrew archives
- uploads the archive to the GitHub release
- updates \`beeper/homebrew-tap\` with the pinned archive SHA

Required repository secrets:

- \`HOMEBREW_TAP_GITHUB_TOKEN\`
`;

const targets = ['README.md', '../../README.md'];

if (check) {
  for (const target of targets) {
    const current = await readFile(target, 'utf8');
    if (current !== readme) {
      console.error(`${target} is out of date. Run bun run readme.`);
      process.exit(1);
    }
  }
} else {
  for (const target of targets) {
    await writeFile(target, readme);
  }
}

function commandSection(command) {
  const id = displayID(command.id);
  const usage = usageFor(command);
  const parts = [
    `### \`beeper ${id}\``,
    text(command.summary || command.description || ''),
    '',
    '```sh',
    usage,
    '```',
  ];

  if (command.description && command.description !== command.summary) {
    parts.push('', text(command.description));
  }

  const args = Object.values(command.args || {});
  if (args.length > 0) {
    parts.push('', 'Arguments:', '', '| Name | Required | Description |', '| --- | --- | --- |');
    for (const arg of args) {
      parts.push(`| \`${arg.name}\` | ${arg.required ? 'yes' : 'no'} | ${escapeTable(arg.description || '')} |`);
    }
  }

  const flags = Object.values(command.flags || {}).filter(flag => !globalFlags.has(flag.name));
  if (flags.length > 0) {
    parts.push('', 'Flags:', '', '| Flag | Type | Description |', '| --- | --- | --- |');
    for (const flag of flags.sort((a, b) => a.name.localeCompare(b.name))) {
      parts.push(`| \`${flagLabel(flag)}\` | ${flag.type || 'boolean'} | ${escapeTable(flagDescription(flag))} |`);
    }
  }

  const examples = examplesByID.get(id) ?? [];
  if (examples.length > 0) {
    parts.push('', 'Examples:', '', '```sh', ...examples, '```');
  }

  const inherited = Object.values(command.flags || {}).filter(flag => globalFlags.has(flag.name));
  if (inherited.length > 0) {
    parts.push('', `Global flags: ${inherited.map(flag => `\`--${flag.name}\``).join(', ')}.`);
  }

  return parts.filter((part, index, array) => part !== '' || array[index - 1] !== '').join('\n');
}

function displayID(id) {
  return id.replaceAll(':', ' ');
}

function usageFor(command) {
  const args = Object.values(command.args || {}).map(arg => arg.required ? `<${arg.name}>` : `[${arg.name}]`);
  return ['beeper', displayID(command.id), ...args].join(' ');
}

function flagLabel(flag) {
  const prefix = flag.char ? `-${flag.char}, --${flag.name}` : `--${flag.name}`;
  if (flag.type === 'boolean') return prefix;
  const value = flag.options?.length ? `<${flag.options.join('|')}>` : '<value>';
  return `${prefix}=${value}${flag.multiple ? '...' : ''}`;
}

function flagDescription(flag) {
  const details = [];
  if (flag.description) details.push(text(flag.description));
  if (flag.default !== undefined) details.push(`Default: ${String(flag.default)}`);
  if (flag.required) details.push('Required.');
  return details.join(' ');
}

function escapeTable(value) {
  return text(value).replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
}

function text(value) {
  return String(value)
    .replaceAll('<%= config.bin %>', config.bin)
    .replaceAll('<%= command.id %>', '')
    .replace(/\s+/g, ' ')
    .trim();
}
