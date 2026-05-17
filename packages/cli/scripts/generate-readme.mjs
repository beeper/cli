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

const readme = `# Beeper CLI

Command-line access to Beeper Desktop and Beeper Server targets.

## Inspiration

This CLI is shamelessly inspired by [wacli](https://wacli.sh/), a WhatsApp CLI
that gets the command-line product shape right. The Beeper CLI borrows the same
basic taste: workflow-first commands, human-readable output by default, exact
\`--json\` for scripts, \`--events\` for long-running automation, \`--read-only\`
for safe agent/tool use, and command names that optimize for what people are
trying to do rather than for raw API resource names.

When in doubt, the model is simple: make the default output pleasant to read,
make machine output boring and stable, keep write commands explicit, and expose
one obvious command for each job. The public object is a target; local runtime
profiles are implementation details.

## Install

Beeper CLI is distributed through Homebrew as a built release archive:

\`\`\`sh
brew install beeper/tap/beeper-cli
\`\`\`

The installed command is \`beeper\`.

## Local Development

\`\`\`sh
npm install
npm run build
node ./bin/run.js --help
\`\`\`

Run commands directly from TypeScript:

\`\`\`sh
npm run dev -- --help
\`\`\`

Regenerate this README after command, flag, or argument changes:

\`\`\`sh
npm run readme
\`\`\`

## Setup

\`\`\`sh
beeper setup
beeper status
beeper auth status
\`\`\`

\`beeper setup\` makes the selected target ready. It is safe to run again: the
command inspects the current target state and continues from login, device
verification, recovery-key, first-sync, or ready states.

For non-interactive use, pass a token through the environment:

\`\`\`sh
BEEPER_ACCESS_TOKEN=... beeper chats --json
\`\`\`

## Common Workflows

\`\`\`sh
beeper doctor
beeper status
beeper targets list
beeper accounts list
beeper chats list
beeper messages list --chat "Family" --limit 50
beeper send text --to "Family" --message "on my way"
beeper send file --to "Family" --file ./photo.jpg --caption "from today"
beeper export --out ./beeper-export
beeper api get /v1/info
\`\`\`

## Input Resolution

- Chat arguments accept Beeper chat IDs, local chat IDs, exact titles, or search text.
- Ambiguous chat matches return numbered choices; pass \`--pick N\` to select one.
- Account arguments accept account IDs, network names, bridge type/id, or account user identity.
- Account filters can expand a network name to multiple matching accounts.
- \`contacts search\` and \`chats start\` can search across all accounts when \`--account\` is omitted.
- \`contacts list\` accepts the same account selectors as other account-scoped commands.

## Output

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

## Environment

| Environment variable | Description |
| --- | --- |
| \`BEEPER_ACCESS_TOKEN\` | Bearer token. Overrides stored OAuth login. |
| \`BEEPER_DESKTOP_BASE_URL\` | Beeper Desktop API base URL. Defaults to \`http://127.0.0.1:23373\`. |
| \`BEEPER_BASE_URL\` | SDK-compatible base URL fallback. |
| \`BEEPER_CLI_CONFIG_DIR\` | Override config directory for testing or isolated profiles. |

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
