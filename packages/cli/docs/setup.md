# setup

Read when: making a Beeper target ready for the first time, switching to a
different target, or installing a managed runtime.

`beeper setup` orchestrates the path from "I have nothing" to "the selected
target is ready". By default it detects a running local Beeper Desktop, offers
to reuse that session, and falls back to a guided choice between Desktop /
Server / remote targets.

## Commands

```sh
beeper setup [--local | --oauth | --email ADDR]
beeper setup [--remote URL | --desktop | --server] [--email ADDR] [--install] [--channel stable|nightly]
beeper install desktop [--channel stable|nightly]
beeper install server  [--channel stable|nightly] [--server-env production|staging]
```

## Notes

- `setup --local` reuses the local Beeper Desktop session (fastest trusted-device path).
- `setup --oauth` runs browser-based OAuth/PKCE against the resolved target.
- `setup --remote URL` configures a remote Beeper Desktop or Server target.
- `setup --desktop --install` or `setup --server --install` installs the runtime if missing, then sets up.
- `setup --email ADDR` signs in with an emailed code instead of a browser. Combine it with `--server`, `--desktop`, or `--remote URL`; see [Headless server setup](#headless-server-setup).
- `install desktop|server` installs without changing the selected target.
- The selected target is persisted in `~/.beeper/config.json` (override with `BEEPER_CLI_CONFIG_DIR`).
- For non-interactive use, pass a token in the environment: `BEEPER_ACCESS_TOKEN=… beeper …`.

## Headless server setup

No browser on the machine (VPS, SSH-only box)? Sign in with an emailed code:

```sh
beeper setup --server --install --email you@example.com
```

`setup` installs and starts Beeper Server, emails you a code, prompts for it,
then starts device verification: approve it from another signed-in Beeper
device. Server already installed? Drop `--install`. No other device? Use your
recovery key:

```sh
beeper verify recovery-key -t server --key "ABCD-EFGH-IJKL-MNOP"
```

Keep the server running across reboots:

```sh
beeper targets enable server          # systemd user unit on Linux, launchd agent on macOS
sudo loginctl enable-linger "$USER"   # Linux: start user units at boot, not at first login
```

### Scripts and agents

`setup --email` prompts for the code. Without a TTY, sign in with two calls:

```sh
beeper setup --server --install --yes
beeper auth email start --email you@example.com -t server --json     # returns setupRequestID
beeper auth email response --setup-request-id <id> --code <code> -t server --json
beeper verify recovery-key -t server --key "$BEEPER_RECOVERY_KEY" --json
```

If the email has no Beeper account yet, add `--username <name> --yes` to
`auth email response` to create one and accept the terms.

## Examples

```sh
beeper setup
beeper setup --local
beeper setup --oauth
beeper setup --remote https://desktop.example.com
beeper setup --desktop --install --channel nightly
beeper setup --server --install --email you@example.com
beeper install server --server-env staging
```
