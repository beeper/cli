# auth

Read when: checking sign-in status, clearing stored tokens, or driving an
end-to-end device-verification flow for encrypted messages.

`auth` commands inspect and manage CLI-side authentication state and
encryption-readiness. The selected target's stored OAuth token lives in the
target file under `~/.beeper/targets/`; `BEEPER_ACCESS_TOKEN` overrides it.

## Commands

```sh
beeper auth status
beeper auth logout
beeper auth email start     --email <addr>              # start headless email sign-in
beeper auth email response  --code <code> --setup-request-id <id>  # finish email sign-in
beeper auth verify [--user @id]                         # interactive happy-path
beeper auth verify start    [--user @id]                # individual steps
beeper auth verify status
beeper auth verify list | show
beeper auth verify approve  [--id active] [--code …]
beeper auth verify sas
beeper auth verify sas-confirm
beeper auth verify qr-scan --payload <data>
beeper auth verify qr-confirm
beeper auth verify recovery-key       [--code KEY]
beeper auth verify reset-recovery-key
beeper auth verify cancel
```

## Notes

- `auth status` reports the token source (env vs. target file) and metadata; it does not call the network.
- `auth logout` revokes the token at the Desktop OAuth endpoint and clears the local copy.
- `auth email start` + `auth email response` provide a two-step email-based sign-in that works without a browser — ideal for headless servers and VPS environments. See [setup — Headless server setup](setup.md#headless-server-setup) for a full walkthrough.
- `auth verify` (no subcommand) walks the most common SAS/emoji verification flow interactively.
- For agents, drive the explicit subcommands (`start` → `sas` → `sas-confirm`) and use `--json` to inspect state.
- `verify status` returns the encryption-readiness state (`ready`, `needs-verification`, `verification-in-progress`).
- `recovery-key` and `reset-recovery-key` apply to the encrypted-messages key, not to Beeper account login.

## Examples

```sh
beeper auth status --json
beeper auth email start --email you@example.com -t server
beeper auth email response --code 123456 --setup-request-id <id> -t server --yes
beeper auth verify
beeper auth verify recovery-key --code ABCD-EFGH-IJKL-MNOP
beeper auth verify reset-recovery-key
beeper auth logout
```
