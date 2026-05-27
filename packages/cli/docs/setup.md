# setup

Read when: making a Beeper target ready for the first time, switching to a
different target, or installing a managed runtime.

`beeper setup` orchestrates the path from "I have nothing" to "the selected
target is ready". By default it detects a running local Beeper Desktop, offers
to reuse that session, and falls back to a guided choice between Desktop /
Server / remote targets.

## Commands

```sh
beeper setup [--local | --oauth | --remote URL | --desktop | --server] [--install] [--channel stable|nightly]
beeper install desktop [--channel stable|nightly]
beeper install server  [--channel stable|nightly] [--server-env production|staging]
```

## Notes

- `setup --local` reuses the local Beeper Desktop session (fastest trusted-device path).
- `setup --oauth` runs browser-based OAuth/PKCE against the resolved target.
- `setup --remote URL` configures a remote Beeper Desktop or Server target.
- `setup --desktop --install` or `setup --server --install` installs the runtime if missing, then sets up.
- `setup --email` signs in with a verification code sent to an email address — no browser required (see [Headless server setup](#headless-server-setup) below).
- `install desktop|server` installs without changing the selected target.
- The selected target is persisted in `~/.beeper/config.json` (override with `BEEPER_CLI_CONFIG_DIR`).
- For non-interactive use, pass a token in the environment: `BEEPER_ACCESS_TOKEN=… beeper …`.

## Headless server setup

When running on a machine with no graphical environment (VPS, headless server),
browser-based OAuth is not available. Use the email-based auth flow instead:

```sh
# 1. Install and start the server
beeper setup --server --install

# 2. Sign in with email (no browser needed)
beeper auth email start --email you@example.com -t server
# → returns a setupRequestID

# 3. Enter the verification code received by email
beeper auth email response --code 123456 --setup-request-id <id-from-step-2> -t server --yes

# 4. Verify the device (approve from another Beeper device, or use your recovery key)
beeper verify recovery-key -t server --key "YOUR_RECOVERY_KEY"

# 5. Enable auto-start at login
beeper targets enable server
```

After step 4 the server reaches `ready` state and bridges begin syncing.

## Examples

```sh
beeper setup
beeper setup --local
beeper setup --oauth
beeper setup --remote https://desktop.example.com
beeper setup --desktop --install --channel nightly
beeper setup --server --install
beeper install server --server-env staging
```
