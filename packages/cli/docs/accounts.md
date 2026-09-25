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
- For cookie-based sign-in, `--webview` signs you in through a browser and
  collects the cookie fields for you. Anything it can't collect falls back to
  prompts. See [Browser sign-in](#browser-sign-in-webview).

## Examples

```sh
beeper accounts list --json
beeper bridges list
beeper accounts add local-whatsapp
beeper accounts add discord --non-interactive --cookie sessionid=…
beeper accounts add discord --webview
beeper accounts add discord --webview --webview-browser-path /usr/bin/brave-browser
beeper accounts use whatsapp-main
beeper accounts use ""
beeper accounts show whatsapp-main --json
beeper accounts remove whatsapp-main
```

## Browser sign-in (`--webview`)

Some networks (Discord, Instagram, LinkedIn, …) sign in with cookies. With
`--webview`, the CLI opens the network's login page, you sign in, and the CLI
reads the cookies it needs. Requires Bun (`Bun.WebView`).

What opens:

- **A visible browser window, in a fresh temporary profile.** When run
  interactively, the CLI starts a Chromium-family browser with an empty profile
  and a DevTools port on `127.0.0.1`. You won't be signed in to anything there,
  and your normal browser profile, cookies, and extensions are never touched.
  The window and its profile are deleted when sign-in finishes, fails, or times
  out.
- **Browser lookup order:** `--webview-browser-path`, then `BUN_CHROME_PATH`,
  then the first installed of Chrome, Chromium, Brave, Edge, Opera, and Vivaldi
  (on PATH on Linux; in `/Applications` on macOS).
- **No browser found**, or `--non-interactive`: the CLI falls back to Bun's
  built-in browser. With `--webview-backend chrome` Bun attaches to a Chrome
  that has remote debugging enabled, or starts a headless one. Headless only
  works for pages that finish without typing, so you'll usually get the manual
  cookie prompts instead.

Backends:

| `--webview-backend` | Interactive | `--non-interactive` |
| --- | --- | --- |
| `chrome` (default) | Visible browser, fresh profile | Bun's Chrome (attached or headless) |
| `auto` | Linux: visible browser. macOS: WebKit, unless `--webview-browser-path` is set | Bun default |
| `webkit` | macOS WebKit (headless) | Same |

`--webview-browser-path` can't be combined with `webkit`. `--webview-timeout`
(default 120 seconds) limits how long the CLI waits for the cookies.
