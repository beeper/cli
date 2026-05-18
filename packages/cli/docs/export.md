# export

Read when: making a heavy, multi-chat, attachment-including export of Beeper
data to disk. For a lightweight per-chat JSON dump, see [messages
export](messages.md).

## Command

```sh
beeper export
  [-o, --out DIR]
  [--account SEL]...
  [--chat SEL]...
  [--limit-chats N]
  [--limit-messages N]
  [--max-participants N]
  [--no-attachments]
  [--force]
  [--quiet]
  [--pick N]
```

## Notes

- Default `--out` directory is `beeper-export`.
- Layout: `accounts.json`, `chats.json`, `manifest.json`, plus one directory per chat with `chat.json`, `messages.json`, `messages.markdown`, `messages.html`, attachments, and per-chat checkpoint state.
- Exports are resumable. Re-running picks up where the last run left off unless `--force` is set.
- `--max-participants` (default 500) bounds the participant list stored in each `chat.json`.
- `--no-attachments` skips downloading media; metadata is still recorded.
- `--limit-chats` / `--limit-messages` are intended for sanity-checking large exports.

## Examples

```sh
beeper export --out ./beeper-export
beeper export --chat "Family" --out ./family
beeper export --account whatsapp --no-attachments --quiet
beeper export --force --out ./beeper-export
```
