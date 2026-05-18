# targets

Read when: managing local Desktop, managed Server, or remote Beeper API
targets — adding, switching, starting/stopping a managed runtime, or removing
a target.

A *target* is a runnable or reachable Beeper endpoint profile: local Server,
local Desktop, Desktop API, or a profile that combines Desktop/Server runtime
state. The CLI tracks an optional default; commands use it unless
`--target <name>` overrides.

## Commands

```sh
beeper targets list
beeper targets add desktop [name] [--port N] [--server-env production|staging] [--default]
beeper targets add server  [name] [--port N] [--server-env production|staging] [--default]
beeper targets add remote  <name> <url> [--default]
beeper targets use <name>
beeper targets show [name]
beeper targets status [name]
beeper targets start | stop | restart [name]
beeper targets logs [name]
beeper targets enable | disable [name]      # start at login
beeper targets remove <name>
```

## Notes

- `list` prints all configured targets; the one used by default has `default: true`.
- `show` defaults to the currently-selected target if no name is given.
- `status` checks endpoint and process reachability. For setup/auth/encryption
  diagnostics use `beeper doctor`.
- `start`/`stop`/`restart` only apply to managed targets (`type: desktop|server`); they error for `remote`.
- `enable`/`disable` registers/unregisters the launchd or systemd unit that
  starts the managed target at login.
- Removing the active default clears the `defaultTarget` config field.
- `BEEPER_TARGET=<name>` overrides the default for a single shell.

## Examples

```sh
beeper targets list --json
beeper targets add desktop work --default
beeper targets add server prod --server-env production --default
beeper targets add remote office https://desktop.office.example.com --default
beeper targets use work
beeper targets logs work | less
beeper targets restart work
```
