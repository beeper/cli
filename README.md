# Beeper Desktop CLI

Command-line access to the [Beeper Desktop API](https://developers.beeper.com/desktop-api/).

The CLI is built with TypeScript, oclif, and the official `@beeper/desktop-api`
SDK. It supports OAuth login, chat and message workflows, live event streaming,
asset transfer, machine-readable output, and raw API access for advanced use.

## Install

```sh
npm install -g @beeper/desktop-api-cli
```

Or with Homebrew:

```sh
brew install beeper/tap/beeper-desktop-cli
```

For local development:

```sh
npm install
npm run build
node ./bin/run.js --help
```

During development, run commands directly from TypeScript:

```sh
npm run dev -- --help
```

The package exposes both `beeper` and `beeper-desktop-cli`.

## Authenticate

```sh
beeper auth login
beeper auth status
```

`auth login` uses OAuth2 Authorization Code with PKCE. It registers a local
client, opens the authorization URL, listens on a loopback callback, exchanges
the authorization code, and stores the bearer token in
`~/.config/beeper/config.json`.

For non-interactive use, pass a token through the environment:

```sh
BEEPER_ACCESS_TOKEN=... beeper chats --json
```

## Common Workflows

```sh
beeper doctor
beeper status
beeper accounts
beeper whoami
```

```sh
beeper chats
beeper chats --ids
beeper chats search dinner
beeper chat "Family"
beeper chat open "Family"
```

```sh
beeper messages "Family"
beeper messages "Family" --ids
beeper messages search deploy --chat "Team"
beeper search pizza
```

```sh
beeper export --out ./beeper-export
beeper export --chat "Family" --out ./family-export
beeper export --account imessage --out ./imessage-export
```

`export` writes `accounts.json`, `chats.json`, `manifest.json`, and one folder
per chat containing `chat.json`, `messages.json`, `messages.markdown`,
`messages.html`, and downloaded attachments. Runs are resumable: interrupted exports keep
`.beeper-export-state.json` plus per-chat `messages.partial.jsonl` checkpoints
and continue from the last saved cursor on the next run. Progress is printed to
stderr by default; pass `--quiet` to suppress it or `--no-attachments` to skip
attachment downloads.

```sh
beeper send "Family" "on my way"
beeper send "Family" "on my way" --wait
beeper send "Family" "see attached" --file ./photo.jpg
beeper reply "Family" MESSAGE_ID "yes"
beeper edit "Family" MESSAGE_ID "updated text"
beeper delete-message "Family" MESSAGE_ID
```

```sh
beeper contacts search jane
beeper contacts search jane --account imessage
beeper start-chat +15551234567
beeper start-chat jane@example.com --account imessage
beeper create-chat --account imessage --participant USER_ID
```

```sh
beeper read "Family"
beeper unread "Family"
beeper archive "Family"
beeper unarchive "Family"
beeper mute "Family"
beeper unmute "Family"
beeper remind "Family" 2026-05-13T12:00:00Z
beeper unremind "Family"
```

```sh
beeper assets upload ./photo.jpg
beeper assets download mxc://example.org/media
```

```sh
beeper watch --json
beeper tail --json
beeper shell
printf '%s\n' '{"id":1,"command":"status --json"}' | beeper rpc
```

```sh
beeper config get --json
beeper config set baseURL http://localhost:23373
beeper config reset
```

```sh
beeper api get /v1/info
beeper api post /v1/chats/CHAT/archive --body '{"archived":true}'
```

## Input Resolution

Commands accept practical identifiers instead of requiring exact IDs everywhere:

- Chat arguments accept Beeper chat IDs, local chat IDs, exact titles, or search text.
- Ambiguous chat matches return numbered choices; pass `--pick N` to select one.
- Account arguments accept account IDs, network names, bridge type/id, or account user identity.
- Account filters can expand a network name to multiple matching accounts.
- `contacts search` and `start-chat` can search across all accounts when `--account` is omitted.

Send commands can wait for Desktop to resolve a pending message:

```sh
beeper send "Family" "on my way" --wait
```

Use `--wait-timeout` and `--wait-interval` to tune the polling window.

## Output

Most commands support:

- `--json` for structured output
- `--debug` for SDK debug logging
- `--base-url` to point at a different local Desktop API server

`commands --json` prints a compact command manifest for tools and agents.
`llm` prints a concise human-readable command guide.

## Compatibility Aliases

These aliases are supported for convenience:

| Alias | Canonical command |
| --- | --- |
| `beeper threads` | `beeper chats` |
| `beeper thread CHAT` | `beeper chat CHAT` |
| `beeper chat open CHAT [MESSAGE]` | `beeper focus CHAT [MESSAGE]` |
| `beeper mark-read CHAT` | `beeper read CHAT` |
| `beeper mark-unread CHAT` | `beeper unread CHAT` |
| `beeper tail` | `beeper watch` |
| `beeper whoami` | `beeper current-user` |

File-oriented helpers are also available:

```sh
beeper send-file CHAT FILE [TEXT]
beeper reply-file CHAT MESSAGE FILE [TEXT]
```

## Environment

| Environment variable | Description |
| --- | --- |
| `BEEPER_ACCESS_TOKEN` | Bearer token. Overrides stored OAuth login. |
| `BEEPER_DESKTOP_BASE_URL` | Beeper Desktop API base URL. Defaults to `http://localhost:23373`. |
| `BEEPER_BASE_URL` | SDK-compatible base URL fallback. |
| `BEEPER_CLI_CONFIG_DIR` | Override config directory for testing or isolated profiles. |

## Publishing

Tagged releases publish the same CLI to npm and Homebrew. Push a `v*` tag to run
`.github/workflows/publish-release.yml`.

The release workflow:

- runs the TypeScript test suite
- publishes `@beeper/desktop-api-cli` to npm with provenance
- builds a Homebrew archive containing the compiled CLI and production dependencies
- uploads the archive to the GitHub release
- updates `beeper/homebrew-tap` with the pinned archive SHA

Required repository secrets:

- `NPM_TOKEN`
- `HOMEBREW_TAP_GITHUB_TOKEN`
