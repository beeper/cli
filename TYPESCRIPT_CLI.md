# TypeScript oclif CLI

This implementation uses oclif and the official `@beeper/desktop-api`
TypeScript SDK.

## Command Surface

```sh
beeper auth login
beeper auth logout
beeper auth status
beeper doctor
beeper status
beeper accounts
beeper contacts search QUERY
beeper contacts search QUERY --account imessage
beeper create-chat --account imessage --participant USER_ID
beeper start-chat +15551234567
beeper start-chat jane@example.com --account imessage
beeper chats
beeper chats --ids
beeper chats search QUERY
beeper chat CHAT
beeper chat open CHAT [MESSAGE]
beeper message CHAT MESSAGE
beeper messages CHAT
beeper messages CHAT --ids
beeper messages search [QUERY]
beeper search QUERY
beeper send CHAT TEXT
beeper send CHAT TEXT --wait
beeper send CHAT TEXT --file ./image.png
beeper send-file CHAT ./image.png [TEXT]
beeper reply CHAT MESSAGE TEXT
beeper reply-file CHAT MESSAGE ./image.png [TEXT]
beeper edit CHAT MESSAGE TEXT
beeper delete-message CHAT MESSAGE
beeper react CHAT MESSAGE REACTION
beeper unreact CHAT MESSAGE REACTION
beeper focus [CHAT] [MESSAGE]
beeper draft CHAT TEXT
beeper clear-draft CHAT
beeper archive CHAT
beeper unarchive CHAT
beeper read CHAT
beeper unread CHAT
beeper mute CHAT
beeper unmute CHAT
beeper notify-anyway CHAT
beeper remind CHAT 2026-05-13T12:00:00Z
beeper unremind CHAT
beeper assets upload ./file.png
beeper assets download mxc://example.org/media
beeper current-user
beeper commands --json
beeper llm
beeper shell
beeper rpc
beeper watch --json
beeper tail --json
beeper whoami
beeper config get --json
beeper config set baseURL http://localhost:23373
beeper config reset
beeper threads
beeper thread CHAT
beeper mark-read CHAT
beeper mark-unread CHAT
beeper api get PATH
beeper api post PATH --body JSON
```

## Resolution

- Chat arguments accept chat IDs, local chat IDs, exact titles, or search text.
- Ambiguous chat matches return numbered choices and accept `--pick N`.
- Account arguments accept account IDs, network names, bridge type/id, or account user identity.
- Account filters can expand one network to multiple accounts.
- Contact and start-chat commands search across accounts when no account is specified.

## Send Confirmation

Send and reply commands accept `--wait`, `--wait-timeout`, and
`--wait-interval`. `--wait` polls the pending message ID returned by Desktop
until it resolves to a message.

## OAuth

`auth login` uses OAuth2 Authorization Code with PKCE:

1. Start a loopback callback server on `127.0.0.1`.
2. Register a public OAuth client with `POST /oauth/register`.
3. Generate an S256 PKCE verifier/challenge pair and random state.
4. Open `GET /oauth/authorize`.
5. Validate the callback `state`.
6. Exchange the code with `POST /oauth/token`.
7. Store the bearer token under `~/.config/beeper/config.json` with mode `0600`.
