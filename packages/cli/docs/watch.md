# watch

Read when: subscribing to live Desktop API events (new/updated/deleted chats
and messages), optionally forwarding them to a webhook.

## Commands

```sh
beeper watch
  [-c, --chat CHAT_ID]...
  [--include-type EVENT_TYPE]...
  [--exclude-type EVENT_TYPE]...
  [--webhook URL [--webhook-secret SECRET] [--webhook-queue N]]
  [--json]
```

## Notes

- Subscribes to the Desktop API WebSocket at the path returned by `/v1/info` (defaults to `/v1/ws`).
- Without `--chat`, subscribes to all chats.
- Event types come from the Desktop API: `chat.upserted`, `chat.deleted`, `message.upserted`, `message.deleted`.
- `--include-type` and `--exclude-type` are mutually exclusive.
- `--webhook URL` forwards every event as a POST body (best-effort, fire-and-forget).
- `--webhook-secret SECRET` signs the body with HMAC-SHA256 and sets `X-Beeper-Signature: sha256=<hex>`.
- `--webhook-queue` (default 64) caps pending deliveries; excess events are dropped with a stderr warning.
- `--quiet` suppresses the human-mode status line; `--json` prints raw events line-delimited.

## Examples

```sh
beeper watch
beeper watch --chat '!abc:beeper.com' --json
beeper watch --include-type message.upserted --include-type message.deleted
beeper watch --webhook https://example.com/hook --webhook-secret "$BEEPER_WEBHOOK_SECRET"
```
