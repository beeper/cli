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
beeper auth email start     --email <addr>                          # headless sign-in, step 1
beeper auth email response  --setup-request-id <id> --code <code>   # step 2
beeper verify [--user @id]                                          # interactive happy-path
beeper verify start         [--user @id]                            # individual steps
beeper verify status
beeper verify list | show
beeper verify approve       [--id active]
beeper verify sas
beeper verify sas-confirm
beeper verify qr-scan       --payload <data>
beeper verify qr-confirm
beeper verify recovery-key  --key <value>
beeper verify reset-recovery-key
beeper verify cancel
```

## Notes

- `auth status` reports the token source (env vs. target file) and metadata; it does not call the network.
- `auth logout` revokes the token at the Desktop OAuth endpoint and clears the local copy.
- `auth email start` + `auth email response` sign in with an emailed code, no browser and no prompts. `response` also takes `--username <name> --yes` when the email has no Beeper account yet. Walkthrough: [Headless server setup](setup.md#headless-server-setup).
- `verify` (no subcommand) walks the most common SAS/emoji verification flow interactively.
- For agents, drive the explicit subcommands (`start` → `sas` → `sas-confirm`) and use `--json` to inspect state.
- `verify status` returns the encryption-readiness state (`ready`, `needs-verification`, `verification-in-progress`).
- `recovery-key` and `reset-recovery-key` apply to the encrypted-messages key, not to Beeper account login.
- `reset-recovery-key` signs out every chat account connected through Beeper Cloud on all your devices. Use it only when the recovery key is lost and no other device is verified; otherwise run `verify recovery-key` or approve from another device.

## Examples

```sh
beeper auth status --json
beeper auth email start --email you@example.com -t server --json
beeper auth email response --setup-request-id <id> --code 123456 -t server --json
beeper verify
beeper verify recovery-key -t server --key "ABCD-EFGH-IJKL-MNOP"
beeper verify reset-recovery-key
beeper auth logout
```
