# labels

Read when: discovering Beeper chat labels and using them to scope chat workflows.

## Commands

```sh
beeper labels list [--ids]
beeper chats search [query] --label NAME_OR_ID [--unread] [--limit N] [--ids]
```

## Notes

- Labels are user-created groupings that can span accounts.
- `labels list` reads the labels exposed by `GET /v1/labels`.
- `chats search --label` accepts either a label ID or a label name. Exact name/ID matches win; a unique partial match is accepted.
- Combine `--label` with `--unread` to answer workflows such as "what is unread in Work?" without scanning unrelated chats.
- Label creation, renaming, assignment, and removal are not currently writable through the Desktop API. This CLI therefore keeps label operations read-only rather than inventing unsupported writes.

## Examples

```sh
beeper labels list
beeper labels list --json
beeper labels list --ids
beeper chats search --label Work --unread
beeper chats search invoice --label Customers --limit 50
```
