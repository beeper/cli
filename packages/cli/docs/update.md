# update

Read when: checking for new versions of the CLI, the CLI-managed Desktop
install, or the CLI-managed Server install — and choosing whether to install.

## Command

```sh
beeper update [--check] [--cli] [--desktop] [--server]
```

## Notes

- With no kind flag, checks all three (CLI, Desktop, Server) that apply.
- `--check` prints what's available without installing.
- The CLI itself is never auto-upgraded; `--cli` prints the right command for your install method (Homebrew, npm-global, or in-repo git build).
- `--desktop` reports on the CLI-owned Desktop install; updating Desktop itself happens inside the Desktop app.
- `--server` updates the CLI-managed Server install in place, then restarts any running managed Server targets.

## Examples

```sh
beeper update --check
beeper update --cli
beeper update --desktop --json
beeper update --server
```
