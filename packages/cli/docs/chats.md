# chats

Read when: listing, searching, inspecting, or changing chat state — archive,
pin, mute, mark-read, priority (Inbox vs Low Priority), rename, draft, focus,
disappear timer, reminders.

## Commands

```sh
beeper chats list [--account SEL]... [--archived] [--pinned] [--muted] [--unread] [--low-priority] [--limit N] [--ids]
beeper chats search <query> [--account SEL]... [--limit N] [--ids]
beeper chats show     --chat SEL [--max-participants N] [--pick N]
beeper chats start    <user> [--account SEL] [--title TEXT]
beeper chats archive | unarchive          --chat SEL [--pick N]
beeper chats pin     | unpin              --chat SEL [--pick N]
beeper chats mute    | unmute             --chat SEL [--pick N]
beeper chats mark-read | mark-unread      --chat SEL [--message MSG_ID] [--pick N]
beeper chats priority --chat SEL --level inbox|low [--pick N]
beeper chats notify-anyway --chat SEL [--pick N]
beeper chats rename       --chat SEL --title NEW [--pick N]
beeper chats description  --chat SEL [--description TEXT | --clear] [--pick N]
beeper chats avatar       --chat SEL [--file PATH | --clear] [--pick N]
beeper chats draft        --chat SEL [--text TEXT [--file PATH [--filename N] [--mime TYPE]] | --clear] [--pick N]
beeper chats disappear    --chat SEL --seconds N [--pick N]
beeper chats remind       --chat SEL --when ISO [--dismiss-on-message] [--pick N]
beeper chats unremind     --chat SEL [--pick N]
beeper chats focus        --chat SEL [--message MSG_ID] [--draft TEXT] [--attachment PATH] [--pick N]
```

## Notes

- All `--chat` flags accept a Beeper chat ID, a local chat ID, the exact title, or search text.
- Ambiguous matches return numbered choices; pass `--pick N` to select one.
- `chats list` filters compose: e.g. `--unread --no-muted --pinned` returns only pinned, unread, non-muted chats.
- `chats mute` is currently boolean — the Desktop API does not yet expose a mute duration.
- `chats focus` opens Beeper Desktop on the selected chat (and optionally scrolls to a message or prefills the composer).
- `chats disappear --seconds 0` turns disappearing messages off.
- Labels are not yet supported by the Desktop API; there is no `chats label` command in this CLI.

## Examples

```sh
beeper chats list --pinned --limit 50
beeper chats list --unread --no-muted --json
beeper chats search Family
beeper chats start +15551234567
beeper chats archive --chat "Family"
beeper chats mute --chat "Marketing"
beeper chats priority --chat "Family" --level inbox
beeper chats rename --chat "Family" --title "Family ❤"
beeper chats draft --chat "Family" --text "on my way"
beeper chats draft --chat "Family" --clear
beeper chats disappear --chat "Friends" --seconds 86400
beeper chats remind --chat "Family" --when 2026-06-01T09:00:00Z
beeper chats focus --chat "Family"
```
