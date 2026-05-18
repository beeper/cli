# Beeper CLI Staging E2E

This harness is for coordinated staging QA of the unreleased Beeper CLI command
surface. It is intentionally explicit: the default run prints a plan and does
not launch apps, download artifacts, or touch the default Desktop instance.

## Safety Model

- Use a fresh `BEEPER_E2E_RUN_ID` per run.
- Use `BEEPER_E2E_WORKDIR` under `/tmp` unless you need to preserve artifacts.
- The harness writes CLI state under `BEEPER_E2E_CONFIG_DIR`, defaulting to
  `<workdir>/cli-config`.
- Use non-default PAS ports. The default starts at `24573`, not `23373`.
- Every test target uses `--server-env staging`.
- QA users should be `qatest+<digits>@beeper.com`; provide the QA OTP via
  `BEEPER_E2E_OTP` only for scripts that explicitly target verified setup-login
  APIs.
- Do not run `install-server` unless you intend to download the staging server
  artifact.

## Basic Plan

```sh
cd /Users/batuhan/Projects/labs/desktop-api-cli
bun run --filter beeper-cli build

BEEPER_E2E_RUN_ID=qa-$(date +%Y%m%d-%H%M%S) \
bun packages/cli/test/e2e-staging.ts
```

The plan output shows the target names, ports, emails, and follow-up command.

## Full Coordinated Surface Run

Use this when a staging server binary already exists or `BEEPER_SERVER_BIN` is
set. This creates isolated targets, starts them, authenticates Desktop targets
with `beeper setup --local` and Server targets with `beeper setup --oauth`,
checks readiness, attempts device verification commands, runs a small messaging
pass, creates a group when three QA users are available, runs CLI/API surface
coverage, and stops managed server targets.
Server targets sign in through the public setup API using `beeper api post
--no-auth` and the QA OTP from `BEEPER_E2E_OTP`. Put the OTP in `.env.e2e` or
point `BEEPER_E2E_ENV_FILE` at the secret env file. The report redacts OTPs,
setup responses, access tokens, and lead tokens. Desktop targets still use
`beeper setup --local` after the isolated Desktop profile has been signed in
through the app UI.

```sh
BEEPER_E2E_RUN_ID=qa-$(date +%Y%m%d-%H%M%S) \
BEEPER_E2E_ENV_FILE=.env.e2e \
BEEPER_E2E_PHASES=targets,start,login,readiness,verify,messaging,surface,cleanup \
BEEPER_E2E_ACCOUNT_COUNT=3 \
BEEPER_E2E_DESKTOP_TARGETS=1 \
BEEPER_E2E_SERVER_TARGETS=2 \
BEEPER_E2E_PORT_START=24573 \
bun packages/cli/test/e2e-staging.ts
```

The report is written to `/tmp/beeper-cli-e2e-<run-id>/report.json` by default.
Expected human steps are written under `blocked` with concrete follow-up
commands. Real harness failures are written under `failures`.

The `surface` phase is the consolidated Desktop/Client API coverage pass. It
uses CLI commands when the CLI has a first-class command and falls back to
`beeper api request` for raw API methods that do not have a dedicated command.
It intentionally does not add external network accounts; `accounts add` is
covered only up to listing available account types.

## Downloading Beeper Server

Only run this when you want the CLI to download the staging server artifact:

```sh
BEEPER_E2E_RUN_ID=qa-$(date +%Y%m%d-%H%M%S) \
BEEPER_E2E_OTP="$QA_OTP" \
BEEPER_E2E_PHASES=targets,install-server,start,login,readiness,verify,messaging,cleanup \
bun packages/cli/test/e2e-staging.ts
```

The `install-server` phase runs:

```sh
beeper install server --server-env staging --json
```

That command downloads software. It does not install npm, GitHub, or package
dependencies, and it does not modify lockfiles.

## Manual Coordination Points

Device-to-device auth may require looking at the two target UIs and matching SAS
or QR state. The harness records the CLI attempts for:

- `verify status`
- `verify list`
- `verify start`
- `verify show`
- `verify sas`
- `verify sas confirm`

If the verification transaction needs UI confirmation, use the report to find
the target names and ports, complete the UI action, then rerun:

```sh
BEEPER_E2E_RUN_ID=<same-run-id> \
BEEPER_E2E_PHASES=verify,readiness \
bun packages/cli/test/e2e-staging.ts
```

If login is blocked, the report includes target-specific commands for opening
the isolated target and rerunning `setup --local` or the setup API commands.
Complete the browser or Desktop UI step, then rerun:

```sh
BEEPER_E2E_RUN_ID=<same-run-id> \
BEEPER_E2E_OTP="$QA_OTP" \
BEEPER_E2E_PHASES=login,readiness,verify,messaging,cleanup \
bun packages/cli/test/e2e-staging.ts
```

## Cleanup

Managed server targets can be stopped through the CLI:

```sh
BEEPER_E2E_RUN_ID=<same-run-id> \
BEEPER_E2E_PHASES=cleanup \
bun packages/cli/test/e2e-staging.ts
```

Desktop targets launched through the app may need to be quit manually. The
harness uses separate `BEEPER_PROFILE`, data directories, and ports, so this
does not require touching the default Desktop profile.
