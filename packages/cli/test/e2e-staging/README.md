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
- QA users should be `staging-user@example.invalid`; the fixed OTP is `[REDACTED_OTP]`.
- Do not run `install-server` unless you intend to download the staging server
  artifact.

## Basic Plan

```sh
cd path/to/cli
pnpm --dir packages/cli build

BEEPER_E2E_RUN_ID=qa-$(date +%Y%m%d-%H%M%S) \
node packages/cli/test/e2e-staging.mjs
```

The plan output shows the target names, ports, emails, and follow-up command.

## Full Coordinated Run

Use this when a staging server binary already exists or `BEEPER_SERVER_BIN` is
set. This creates isolated targets, starts them, signs them in through the app
setup API, checks readiness, attempts device verification commands, runs a small
messaging pass, and stops managed server targets.

```sh
BEEPER_E2E_RUN_ID=qa-$(date +%Y%m%d-%H%M%S) \
BEEPER_E2E_PHASES=targets,start,login,readiness,verify,messaging,cleanup \
BEEPER_E2E_ACCOUNT_COUNT=3 \
BEEPER_E2E_DESKTOP_TARGETS=1 \
BEEPER_E2E_SERVER_TARGETS=2 \
BEEPER_E2E_PORT_START=24573 \
node packages/cli/test/e2e-staging.mjs
```

The report is written to `/tmp/beeper-cli-e2e-<run-id>/report.json` by default.

## Downloading Beeper Server

Only run this when you want the CLI to download the staging server artifact:

```sh
BEEPER_E2E_RUN_ID=qa-$(date +%Y%m%d-%H%M%S) \
BEEPER_E2E_PHASES=targets,install-server,start,login,readiness,verify,messaging,cleanup \
node packages/cli/test/e2e-staging.mjs
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
node packages/cli/test/e2e-staging.mjs
```

## Cleanup

Managed server targets can be stopped through the CLI:

```sh
BEEPER_E2E_RUN_ID=<same-run-id> \
BEEPER_E2E_PHASES=cleanup \
node packages/cli/test/e2e-staging.mjs
```

Desktop targets launched through the app may need to be quit manually. The
harness uses separate `BEEPER_PROFILE`, data directories, and ports, so this
does not require touching the default Desktop profile.
