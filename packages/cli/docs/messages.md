# messages

Read when: listing, searching, showing, contextualizing, editing, deleting,
reacting to, or exporting messages from chats.

## Commands

```sh
beeper messages list   --chat SEL [--before-cursor MSG_ID | --after-cursor MSG_ID] [--sender me|others|<id>] [--asc] [--limit N] [--ids] [--pick N]
beeper messages search [query] [--account SEL]... [--chat SEL]... [--chat-type group|single] [--sender me|others|<id>] [--media TYPE]... [--after ISO] [--before ISO] [--include-muted | --no-include-muted] [--exclude-low-priority | --no-exclude-low-priority] [--limit N] [--ids]
beeper messages show     --chat SEL --id MSG_ID [--pick N]
beeper messages context  --chat SEL --id MSG_ID [--before N] [--after N] [--pick N]
beeper messages edit     --chat SEL --id MSG_ID --message TEXT [--pick N]
beeper messages delete   --chat SEL --id MSG_ID [--for-everyone] [--pick N]
beeper messages react    --chat SEL --id MSG_ID --reaction KEY [--pick N]   # hidden; prefer `send react`
beeper messages unreact  --chat SEL --id MSG_ID --reaction KEY [--pick N]   # hidden; prefer `send unreact`
beeper messages export   --chat SEL [--before-cursor MSG_ID | --after-cursor MSG_ID] [--after ISO] [--before ISO] [--limit N] [--output PATH | -o -] [--asc] [--pick N]
```

## Notes

- `--before-cursor` / `--after-cursor` paginate by message ID (the SDK's cursor model).
- `--before` / `--after` in `messages search` and `messages export` filter by ISO timestamp.
- `messages search` rejects an empty query *and* no filter flags with exit code 2 (`usageError`).
- `messages list --sender` filters client-side: `me` (your own messages), `others`, or an exact user ID.
- `messages list --asc` reverses the default newest-first order.
- `messages export` writes one chat to JSON. Use top-level `export` for a full
  export with transcripts, attachments, and multiple chats.
- `messages export --output -` writes JSON to stdout for piping.
- `messages delete --for-everyone` requires the network supports it; otherwise it falls back to delete-for-you.
- `messages edit` only succeeds on your own text messages with no attachments.
- `messages react`/`unreact` are hidden in `--help` in favor of `send react`/`send unreact`.

## Examples

```sh
beeper messages list --chat 10313 --limit 50
beeper messages list --chat 10313 --sender me --asc
beeper messages list --chat 8951 --before-cursor "$LAST_ID" --limit 200
beeper messages search "invoice"
beeper messages search --chat 10313 --sender me --media image --after 2026-01-01
beeper messages show    --chat 10313 --id ABC123
beeper messages context --chat 10313 --id ABC123 --before 5 --after 5
beeper messages edit    --chat 10313 --id ABC123 --message "fixed typo"
beeper messages delete  --chat 10313 --id ABC123 --for-everyone
beeper messages export  --chat 10313 --output family.json
beeper messages export  --chat 8951 --after 2026-01-01T00:00:00Z -o -
```
