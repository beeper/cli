#!/usr/bin/env node
import {readFile, writeFile} from 'node:fs/promises';
import {Config} from '@oclif/core/config';
import {commandManifest} from '../dist/lib/manifest.js';

const config = await Config.load({root: process.cwd()});
const check = process.argv.includes('--check');
const commandsByID = new Map([...config.commands].filter(command => !command.hidden).map(command => [displayID(command.id), command]));
const commands = commandManifest.map(item => {
  const command = commandsByID.get(item.command);
  if (!command) throw new Error(`Missing command from built oclif config: ${item.command}`);
  return command;
});

const globalFlags = new Set(['base-url', 'debug', 'events', 'full', 'json', 'read-only', 'target', 'timeout', 'yes']);
const commandList = commands.map(command => {
  const id = displayID(command.id);
  return `| \`${id}\` | ${escapeTable(text(command.summary || command.description || ''))} |`;
});

const commandSections = commands.map(command => commandSection(command)).join('\n\n');

const readme = `# Beeper CLI - Beeper from your terminal

A scriptable Beeper client for people and agents. It talks to a local Beeper
Desktop API or a configured Beeper Server target, then gives you setup,
account management, chat search, message reading, sending, media downloads,
exports, diagnostics, and raw API access from the command line.

> Requires a running Beeper Desktop API or a configured Beeper Server target.

Command manual: \`beeper man\`

## Features

- **Setup + readiness** - \`setup\`, \`status\`, \`doctor\`, and verification commands guide a target from login through encrypted-message readiness.
- **Targets** - use local Desktop, managed Desktop, managed Server, or remote Beeper targets with one selected default.
- **Accounts** - list connected networks, add accounts, switch defaults, inspect details, and remove accounts.
- **Chats + contacts** - list, search, start, archive, pin, mute, mark, rename, and inspect chats across accounts.
- **Messages + media** - list, search, show, edit, delete, react, send text/files, and download message media.
- **Exports** - write accounts, chats, messages, Markdown transcripts, HTML transcripts, and attachments to disk.
- **Automation** - \`--json\` everywhere, NDJSON \`--events\`, \`rpc\` over stdin/stdout, and \`man --json\` for tool manifests.
- **Safety** - \`--read-only\` rejects mutating commands, while raw API access remains explicit under \`api get\` and \`api post\`.

## Install

### Homebrew

\`\`\`sh
brew install beeper/tap/beeper-cli
\`\`\`

The installed command is \`beeper\`.

### Build from source

Install dependencies before running these commands.

\`\`\`sh
pnpm --filter beeper-cli build
pnpm --filter beeper-cli dev -- --help
\`\`\`

For local CLI development inside \`packages/cli\`:

\`\`\`sh
pnpm dev -- --help
\`\`\`

Regenerate this README after command, flag, or argument changes:

\`\`\`sh
pnpm readme
\`\`\`

## Quick start

\`\`\`sh
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
\`\`\`

\`beeper setup\` makes the selected target ready. It is safe to run again: the
command inspects the current target state and continues from login, device
verification, recovery-key, first-sync, or ready states.

For non-interactive use, pass a token through the environment:

\`\`\`sh
BEEPER_ACCESS_TOKEN=... beeper chats --json
\`\`\`

## Documentation

| Area | Commands |
| --- | --- |
| **Setup** | \`setup\` · \`doctor\` · \`status\` · \`auth status\` · \`verify\` |
| **Targets** | \`targets list\` · \`targets use\` · \`targets status\` · \`targets logs\` |
| **Accounts** | \`accounts list\` · \`accounts add\` · \`accounts show\` · \`accounts remove\` |
| **Messaging** | \`chats list\` · \`messages list\` · \`send text\` · \`send file\` · \`media download\` |
| **Contacts** | \`contacts list\` · \`contacts search\` · \`contacts show\` |
| **Automation** | \`watch\` · \`rpc\` · \`man\` · \`api get\` · \`api post\` |
| **Maintenance** | \`install desktop\` · \`install server\` · \`update\` · \`config\` · \`completion\` |

Use \`beeper docs\` to open the CLI docs and \`beeper man\` to print the local
command manual.

## Configuration

Default Desktop API target: \`http://127.0.0.1:23373\`.

**Global flags:** \`--base-url\`, \`--target\`, \`--json\`, \`--events\`,
\`--full\`, \`--timeout\`, \`--read-only\`, \`--debug\`, \`--yes\`.

**Environment overrides:**

| Variable | Effect |
| --- | --- |
| \`BEEPER_ACCESS_TOKEN\` | Bearer token. Overrides stored OAuth login. |
| \`BEEPER_DESKTOP_BASE_URL\` | Beeper Desktop API base URL. Defaults to \`http://127.0.0.1:23373\`. |
| \`BEEPER_BASE_URL\` | SDK-compatible base URL fallback. |
| \`BEEPER_CLI_CONFIG_DIR\` | Override config directory for testing or isolated profiles. |

## Addressing

- Chat arguments accept Beeper chat IDs, local chat IDs, exact titles, or search text.
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

Raw Desktop API calls live under \`api\`, so scripts can reach a new endpoint
before a workflow command exists:

\`\`\`sh
beeper api get /v1/info
beeper api post /v1/messages/{chatID}/send --body '{"text":"hello"}'
\`\`\`

## Inspiration

This CLI is shamelessly inspired by [wacli](https://wacli.sh/), a WhatsApp CLI
that gets the command-line product shape right. Beeper CLI borrows the same
taste: workflow-first commands, readable default output, boring machine output,
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

- runs the TypeScript test suite
- builds a Homebrew archive containing the compiled CLI and production dependencies
- uploads the archive to the GitHub release
- updates \`beeper/homebrew-tap\` with the pinned archive SHA

Required repository secrets:

- \`HOMEBREW_TAP_GITHUB_TOKEN\`
`;

if (check) {
  const current = await readFile('README.md', 'utf8');
  if (current !== readme) {
    console.error('README.md is out of date. Run npm run readme.');
    process.exit(1);
  }
} else {
  await writeFile('README.md', readme);
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
