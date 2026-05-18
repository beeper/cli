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
- `install desktop|server` installs without changing the selected target.
- The selected target is persisted in `~/.beeper/config.json` (override with `BEEPER_CLI_CONFIG_DIR`).
- For non-interactive use, pass a token in the environment: `BEEPER_ACCESS_TOKEN=… beeper …`.

## Examples

```sh
beeper setup
beeper setup --local
beeper setup --oauth
beeper setup --remote https://desktop.example.com
beeper setup --desktop --install --channel nightly
beeper install server --server-env staging
```
