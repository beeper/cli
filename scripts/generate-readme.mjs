#!/usr/bin/env node
import {readFile, writeFile} from 'node:fs/promises';
import {Config} from '@oclif/core/config';

const config = await Config.load({root: process.cwd()});
const check = process.argv.includes('--check');
const commands = [...config.commands]
  .filter(command => !command.hidden)
  .sort((a, b) => displayID(a.id).localeCompare(displayID(b.id)));

const globalFlags = new Set(['base-url', 'debug', 'json']);
const commandList = commands.map(command => {
  const id = displayID(command.id);
  return `| \`${id}\` | ${escapeTable(text(command.summary || command.description || ''))} |`;
});

const commandSections = commands.map(command => commandSection(command)).join('\n\n');

const readme = `# Beeper CLI

Command-line access to the [Beeper Desktop API](https://developers.beeper.com/desktop-api/).

The CLI is built with TypeScript, oclif, and the official \`@beeper/desktop-api\`
SDK. The command reference below is generated from the oclif command metadata in
the built CLI.

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

## Authenticate

\`\`\`sh
beeper login --server-url http://localhost:23373
beeper auth status
\`\`\`

\`login\` checks the local Desktop app state first. If Beeper Desktop is already
signed in, it uses OAuth2 Authorization Code with PKCE and stores the server URL
and bearer token in \`~/.config/beeper/config.json\`. After that, commands reuse
the remembered server URL.

If the local Desktop app is not authenticated, \`login\` falls into the app
bootstrap flow. You can force that flow with:

\`\`\`sh
beeper login --app-login --email you@example.com
\`\`\`

For non-interactive use, pass a token through the environment:

\`\`\`sh
BEEPER_ACCESS_TOKEN=... beeper chats --json
\`\`\`

## Common Workflows

\`\`\`sh
beeper doctor
beeper status
beeper accounts
beeper chats
beeper messages "Family"
beeper send "Family" "on my way" --wait
beeper export --out ./beeper-export
beeper interactive
beeper api get /v1/info
\`\`\`

## Input Resolution

- Chat arguments accept Beeper chat IDs, local chat IDs, exact titles, or search text.
- Ambiguous chat matches return numbered choices; pass \`--pick N\` to select one.
- Account arguments accept account IDs, network names, bridge type/id, or account user identity.
- Account filters can expand a network name to multiple matching accounts.
- \`contacts search\` and \`start-chat\` can search across all accounts when \`--account\` is omitted.
- \`contacts list\` accepts the same account selectors as other account-scoped commands.

## Output

Most commands support:

- app-like text by default, optimized for scanning chats, messages, contacts, accounts, and assets
- \`--json\` for exact API-shaped structured output
- \`--debug\` for SDK debug logging
- \`--base-url\` to point at a different local Desktop API server

Use \`beeper login --server-url URL\` to remember a Desktop API server URL for
future commands.

\`commands --json\` prints a compact command manifest for tools and agents.
\`llm\` prints a concise human-readable command guide.

## Environment

| Environment variable | Description |
| --- | --- |
| \`BEEPER_ACCESS_TOKEN\` | Bearer token. Overrides stored OAuth login. |
| \`BEEPER_DESKTOP_BASE_URL\` | Beeper Desktop API base URL. Defaults to \`http://localhost:23373\`. |
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
