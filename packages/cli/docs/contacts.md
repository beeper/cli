# contacts

Read when: looking up contacts across one or more accounts.

## Commands

```sh
beeper contacts list   [--account SEL]... [--query TEXT] [--limit N] [--ids]
beeper contacts search <query> [--account SEL]...
beeper contacts show   <id|name|handle> [--account SEL]...
```

## Notes

- `contacts list` reads merged account contacts; without `--account` it iterates all accounts.
- `contacts search` runs the network search where available and returns merged results across accounts; omitting `--account` searches every account.
- `contacts show` accepts a user ID, display name, or phone/handle and finds it on the first matching account.

## Examples

```sh
beeper contacts list --account whatsapp --query alice
beeper contacts list --json
beeper contacts search "alice"
beeper contacts show "Alice" --account whatsapp
beeper contacts show +15551234567
```
