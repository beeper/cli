# send

Read when: sending text, files, reactions, stickers, or voice notes from
scripts or interactive use.

## Commands

```sh
beeper send text    --to SEL --message TEXT [--reply-to MSG_ID] [--mention USER]... [--no-preview] [--wait] [--wait-timeout MS] [--pick N]
beeper send file    --to SEL --file PATH [--caption TEXT] [--filename NAME] [--mime TYPE] [--reply-to MSG_ID] [--wait] [--wait-timeout MS] [--pick N]
beeper send sticker --to SEL --file PATH [--filename NAME] [--mime TYPE] [--reply-to MSG_ID] [--wait] [--wait-timeout MS] [--pick N]
beeper send voice   --to SEL --file PATH [--duration SECONDS] [--filename NAME] [--mime TYPE] [--reply-to MSG_ID] [--wait] [--wait-timeout MS] [--pick N]
beeper send react   --to SEL --id MSG_ID --reaction KEY [--transaction TX_ID] [--pick N]
beeper send unreact --to SEL --id MSG_ID --reaction KEY [--pick N]
```

## Notes

- `--to` accepts a chat ID, local chat ID, exact title, or search text.
- Prefer numeric local chat IDs from `beeper chats list` when scripting against
  the same target/profile. Use full Beeper/Matrix chat IDs for selectors that
  need to work across targets or profiles.
- Send commands return when Desktop accepts the send request. Use `--wait` when
  you need to know whether the message left the pending state or failed.
- `--wait` blocks until the message leaves the pending state (or fails). Default poll cap: `--wait-timeout 30000` ms.
- `--reply-to` quotes an existing message ID.
- `send text --mention <userID>` adds a Matrix mention; repeat for multiple users.
- `send text --no-preview` disables automatic link previews.
- `send sticker` defaults `--mime` to `image/webp`; stickers should be 512×512.
- `send voice` defaults `--mime` to `audio/ogg`; pass `--duration` to override the detected length.
- `send file` accepts any file up to 500 MB. MIME type is detected from the upload if `--mime` is omitted.

## Examples

```sh
beeper send text --to 10313 --message "on my way"
beeper send text --to 8951 --message "ack" --reply-to ABC123
beeper send text --to "@alice:beeper.com" --message "hi @alice" --mention @alice:beeper.com --no-preview
beeper send file --to 10313 --file ./photo.jpg --caption "from today"
beeper send sticker --to 10313 --file ./hi.webp
beeper send voice --to 8951 --file ./note.ogg --duration 12
beeper send react --to 10313 --id ABC123 --reaction "+1"
beeper send unreact --to 10313 --id ABC123 --reaction "+1"
```
