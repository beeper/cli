# presence

Read when: sending typing/paused indicators into a chat from a script or
agent.

## Commands

```sh
beeper presence --chat SEL [--state typing|paused] [--duration SECONDS] [--pick N]
```

## Notes

- Requires server-side support; networks without typing notifications return an error.
- `--state` defaults to `typing`.
- `--duration N` (only valid with `--state typing`) sends `typing`, sleeps N seconds, then sends `paused`.
- The selected chat must be addressable via the usual selector rules (ID, local ID, title, or search text).

## Examples

```sh
beeper presence --chat "Family"
beeper presence --chat "Family" --state paused
beeper presence --chat "Family" --duration 5
```
