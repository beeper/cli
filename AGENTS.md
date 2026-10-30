# AGENTS.md

`beeper` is an oclif CLI that talks to Beeper Desktop or Beeper Server through `@beeper/desktop-api`.

## Layout

A Bun workspace:

- `packages/cli` — the CLI itself (`@beeper/cli`, published as `beeper-cli`).
- `packages/cli-plugin-cloudflare` — an oclif plugin built on the CLI's plugin SDK (`packages/cli/src/plugin-sdk.ts`).
- `packages/npm` — the npm wrapper that ships the prebuilt binaries.

Inside `packages/cli`, one file per command under `src/commands/<topic>/<verb>.ts`; shared code lives in `src/lib`.

## Bootstrap

Bun is pinned to the version in `package.json` → `packageManager`.

```sh
bun install --frozen-lockfile
```

## Build, test, lint

Run from the repo root; these are what CI runs.

```sh
bun run typecheck
bun run test
bun run lint
```

`bun run check` runs typecheck, test, build, and pack in one go.
Try the CLI from source with `bun --filter @beeper/cli run dev -- <args>`.

`bun run test` in `packages/cli` is more than unit tests: it builds, verifies the README is up to date, checks API copy against the SDK, validates the command manifest, runs `test/cli-smoke.ts`, then `bun test`.
Unit tests use `bun:test` and live in `packages/cli/test/*.test.ts`; stub the SDK with `test/fixtures/fake-client.ts`.

Ignore the shell scripts in `packages/cli/scripts/` without an extension (`format`, `mock`, `test`, …); use the `package.json` scripts.

## Adding or changing a command

Commands extend `BeeperCommand` (`src/lib/command.ts`), which supplies the global flags.
Anything that writes to Beeper or local CLI state must call `ensureWritable(flags)` so `--read-only` holds.
Raise user-facing failures with the helpers in `src/lib/errors.ts`, not bare `Error`s, so exit codes and `--json` output stay consistent.

A new command also needs:

- An entry with at least one example in `src/lib/manifest.ts`.
- Its name in `expectedCommands` in `test/cli-smoke.ts`.
- If it wraps a new SDK method, its description in `src/lib/copy.ts` and a row in `scripts/check-api-copy.ts`.

Then regenerate the READMEs with `bun --filter @beeper/cli run readme`.
That rewrites both `packages/cli/README.md` and the root `README.md`; never edit either by hand.
`src/commands.generated.ts` is rewritten by every build — commit it with the change.

## Changesets

User-facing changes to a published package need a changeset: `bun run changeset`.
