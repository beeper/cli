# accounts

Read when: listing or adding chat-network accounts (WhatsApp, Discord,
iMessage, etc.), choosing a default account for `--account`-filtered
commands, or removing one.

## Commands

```sh
beeper accounts list   [--account SELECTOR]... [--ids]
beeper accounts add    [bridge] [--flow ID] [--login-id ID] [--cookie name=value]... [--field id=value]... [--webview] [--non-interactive] [--no-guided]
beeper accounts show   <selector>
beeper accounts use    <selector | "">              # "" clears defaultAccount
beeper accounts remove <selector>
```

## Notes

- An *account selector* matches by account ID, network name, bridge type/id,
  or user identity (display name, username, email, phone).
- A *bridge* is the connector used to add or reconnect a chat account.
- `accounts add` without a bridge opens the account-connection chooser.
- `bridges list` is the scriptable catalog; `accounts add` is the guided
  account connection flow.
- `accounts use NAME` persists `defaultAccount` in CLI config. Subsequent
  account-scoped commands fall back to that default when `--account` is
  omitted.
- `accounts use ""` clears the default.
- `accounts list --json` annotates the default account with `default: true`.
- For non-interactive sign-in, pass `--flow`, `--field`, and `--cookie` and
  add `--non-interactive` to fail instead of prompting.
- For cookie-based sign-in, `--webview` can use Bun.WebView with Chrome to
  collect cookie fields before falling back to prompts. Chrome remote debugging
  must be enabled for a visible interactive tab; otherwise Bun may spawn a
  headless browser.

## Examples

```sh
beeper accounts list --json
beeper bridges list
beeper accounts add local-whatsapp
beeper accounts add discord --non-interactive --cookie sessionid=…
beeper accounts add discord --webview --webview-backend chrome
beeper accounts use whatsapp-main
beeper accounts use ""
beeper accounts show whatsapp-main --json
beeper accounts remove whatsapp-main
```
