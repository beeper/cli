# api

Read when: calling raw Desktop API endpoints that the CLI doesn't yet wrap
with a workflow command.

## Commands

```sh
beeper api get  <path> [--no-auth]
beeper api post <path> [--body JSON] [--no-auth]
beeper api request <method> <path> [--body JSON] [--no-auth]
```

## Notes

- `<path>` is a Desktop API path, e.g. `/v1/info` or `/v1/chats/{chatID}/read`.
- `--no-auth` calls a public path without the bearer token.
- `--body` is sent as `application/json`; default is `{}` for `post`.
- `api request` lets you hit `GET | POST | PUT | PATCH | DELETE`; the others are convenience shortcuts.
- `--read-only` blocks `api post` / `api put` / `api patch` / `api delete` / `api request <write>`.

## Examples

```sh
beeper api get /v1/info
beeper api get /v1/chats --json
beeper api post /v1/chats/abc/read --body '{"messageID":"x"}'
beeper api request PATCH /v1/chats/abc --body '{"isPinned":true}'
```
