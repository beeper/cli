# config

Read when: inspecting, changing, or resetting the CLI's local configuration
file (`~/.beeper/config.json`, or wherever `BEEPER_CLI_CONFIG_DIR` points).

## Commands

```sh
beeper config path
beeper config get  [defaultTarget | defaultAccount | baseURL | auth]
beeper config set  <defaultTarget|defaultAccount> <value | "">
beeper config reset
```

## Notes

- `config path` prints the JSON config path (suitable for `cat` or `cd $(dirname …)`).
- `config get` without a key prints the full config; passing a key prints just that field.
- `auth.accessToken` is always redacted in `config get` output.
- `config set <key> ""` clears the field. Only `defaultTarget` and `defaultAccount` are settable here; other fields are written by commands like `targets use` and `auth verify`.
- `config reset` deletes the config file.

## Examples

```sh
beeper config path
beeper config get --json
beeper config get defaultTarget
beeper config set defaultTarget work
beeper config set defaultAccount ""
beeper config reset
```
