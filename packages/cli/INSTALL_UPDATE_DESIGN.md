# Beeper CLI Install and Update Design

## Goal

Add CLI-owned install and update flows for Beeper Desktop and Beeper Server while
keeping targets and profiles as separate concepts.

This design is intentionally desktop-first:

- `beeper install` installs Beeper Desktop by default.
- The CLI may own at most one Desktop install and one Server install.
- The CLI may manage unlimited Desktop profiles and Desktop API targets.
- Desktop updates are detected, but users are always told to update Desktop in
  the app.
- Server updates are installed locally by the CLI.

## Concepts

### Installation

An installation is a binary or app bundle owned by the CLI.

Proposed storage:

```json
{
  "desktop": {
    "kind": "desktop",
    "channel": "stable",
    "serverEnv": "production",
    "bundleID": "com.automattic.beeper.desktop",
    "version": "4.2.0",
    "path": "~/.beeper/apps/desktop/Beeper.app",
    "feedURL": "https://api.beeper.com/desktop/update-feed.json?...",
    "downloadURL": "https://api.beeper.com/desktop/download/...",
    "installedAt": "2026-05-17T00:00:00.000Z",
    "updatedAt": "2026-05-17T00:00:00.000Z"
  },
  "server": {
    "kind": "server",
    "channel": "nightly",
    "serverEnv": "staging",
    "bundleID": "com.automattic.beeper.server.nightly",
    "version": "4.2.0",
    "path": "~/.beeper/bin/beeper-server",
    "feedURL": "https://api.beeper-staging.com/desktop/update-feed.json?...",
    "downloadURL": "https://api.beeper-staging.com/desktop/download/...",
    "installedAt": "2026-05-17T00:00:00.000Z",
    "updatedAt": "2026-05-17T00:00:00.000Z"
  }
}
```

Suggested file: `~/.beeper/installations.json`.

Recommended local layout:

```text
~/.beeper/apps/desktop/
~/.beeper/apps/server/<version>/
~/.beeper/bin/beeper-server
```

`~/.beeper/bin/beeper-server` should be a symlink or small platform-appropriate
pointer to the current Server executable. Versioned server directories make
updates easier to perform atomically and leave room for rollback without
changing the public command path.

### Target

A target is an API endpoint the CLI can talk to. Existing target files remain in
`~/.beeper/targets/*.json`.

Targets can point at:

- the default running Desktop app
- a CLI-managed Desktop profile
- a CLI-managed Server instance
- any manually added Desktop API compatible URL

Targets should not duplicate install metadata. They may reference an
installation kind if needed, but their source of truth is still the reachable
API endpoint.

### Desktop Profile

A Desktop profile is a local Desktop data directory plus launch metadata. The
existing model remains:

- profile ID
- data directory
- port
- server env
- base URL

Profiles are unlimited even though Desktop installation is singular.

## Commands

### Canonical Commands

```text
beeper install
beeper install desktop --channel stable|nightly
beeper install server --channel stable|nightly
beeper update
beeper setup [--target <id>]
```

### Compatibility and Workflow Commands

```text
beeper app install
beeper server install
beeper server update
```

`beeper app install` should be a wrapper for `beeper install desktop`.

`beeper server install` should be a wrapper for `beeper install server`.

`beeper server update` should be a wrapper for `beeper update --server`.

## Install Behavior

### `beeper install`

Equivalent to:

```text
beeper install desktop
```

Rationale: the product is desktop-first, and Server is an advanced/local runtime
install.

### `beeper install desktop`

Installs one CLI-owned Desktop app for the current platform and architecture.

Flags:

```text
--channel stable|nightly
```

Recommended path: `~/.beeper/apps/desktop`.

The CLI should not install into `/Applications` or `~/Applications` unless that
is explicitly chosen later. Keeping the app in `~/.beeper` preserves the
distinction between a CLI-owned Desktop install and any normal user-installed
Beeper Desktop app.

### `beeper install server`

Installs one CLI-owned Server binary for the current platform and architecture.

Flags:

```text
--channel stable|nightly
--server-env production|staging
```

Rules:

- Windows is unsupported for Server install.
- `--server-env staging` is install-only.
- `--server-env staging` forces `--channel nightly`.
- Update must preserve the installed `serverEnv` and `channel`.
- Users cannot change `serverEnv` through `beeper update`.

The staging server example maps to:

```text
https://api.beeper-staging.com/desktop/download/macos/arm64/stable/com.automattic.beeper.server.nightly
```

The channel segment remains `stable` in that staging redirect example, but the
installation metadata should still record `channel: nightly` because the bundle
ID is nightly and the user-facing contract is nightly.

## Update Behavior

### `beeper update`

Checks all update surfaces:

- CLI package
- CLI-owned Server install
- CLI-owned Desktop install

Behavior:

- CLI: report the newer available version and the package-manager command to
  update. Do not run package managers unless explicitly supported later.
- Server: update the local CLI-owned server binary automatically by default.
- Desktop: always warn that Desktop should be updated in the app, even when an
  update is detected.

Potential flags:

```text
--server
--desktop
--cli
--check
```

`--check` should never modify local binaries.

### `beeper server update`

Equivalent to:

```text
beeper update --server
```

## Version Detection in Lists

### `beeper target list`

The list should include live version metadata when reachable:

```json
{
  "id": "desktop",
  "type": "desktop",
  "url": "http://127.0.0.1:23373",
  "version": "4.2.0",
  "bundleID": "com.automattic.beeper.desktop",
  "update": {
    "available": true,
    "latestVersion": "4.2.1",
    "action": "Update Beeper Desktop in the app."
  }
}
```

Unreachable targets should show `version: "unknown"` or omit live fields. A
single unreachable target should not fail the whole list command.

### `beeper desktop profiles`

Same version detection as `target list`, filtered to Desktop targets/profiles.

The default Desktop row should remain present even if no profile target files
exist.

## Feed and Download Resolution

Use the URL shapes documented in `links.txt`.

Inputs:

- kind: `desktop` or `server`
- channel: `stable` or `nightly`
- server env: `production` or `staging`
- platform: `macos`, `windows`, or `linux`
- update feed platform: `darwin`, `win32`, or `linux`
- arch: `x64` or `arm64`
- bundle ID

Production API host:

```text
https://api.beeper.com
```

Staging API host:

```text
https://api.beeper-staging.com
```

Bundle IDs:

```text
com.automattic.beeper.desktop
com.automattic.beeper.desktop.nightly
com.automattic.beeper.server
com.automattic.beeper.server.nightly
```

## Setup Behavior

`beeper setup [--target <id>]` should stay focused on target selection and target
creation, not installation.

Proposed behavior:

- `beeper setup --target <id>` selects an existing target as default.
- If the target does not exist, return an error with suggestions.
- Interactive setup may suggest installing Desktop/Server when no local API is
  found, but installation should still be explicit.

## Open Decisions

Recommended defaults unless product direction says otherwise:

- Desktop install path: `~/.beeper/apps/desktop`.
- Server install path: versioned `~/.beeper/apps/server/<version>/` plus
  `~/.beeper/bin/beeper-server`.
- Server update policy: auto-replace CLI-owned server binaries.
- Channel coexistence: one install per kind; stable and nightly do not coexist.
- Desktop staging: unsupported.

Remaining product decisions:

1. Running server restart:
   - replace binary only
   - replace and restart known CLI-launched server targets

2. Desktop installation semantics:
   - keep as a CLI-owned app under `~/.beeper`
   - install into a system/user Applications folder

3. Server rollback:
   - keep only current version
   - keep previous version for rollback

## Implementation Checklist

- Add `src/lib/installations.ts`.
- Add feed/download URL builders.
- Add archive download and extraction helpers using Node built-ins and platform
  tools already available on the host.
- Add `src/commands/install/index.ts`.
- Add `src/commands/install/desktop.ts`.
- Add `src/commands/install/server.ts`.
- Add `src/commands/update.ts`.
- Add `src/commands/app/install.ts`.
- Add `src/commands/server/install.ts`.
- Add `src/commands/server/update.ts`.
- Extend `src/commands/target/list.ts` with live version probes.
- Extend `src/commands/desktop/profiles/index.ts` with live version probes.
- Extend `src/commands/setup.ts` with `--target`.
- Update `src/lib/manifest.ts`.
- Update `test/cli-smoke.mjs`.
- Regenerate `README.md`.

## Test Plan

- Unit-style smoke checks for URL resolution:
  - production Desktop stable/nightly
  - production Server stable/nightly
  - staging Server forces nightly metadata and staging API host
  - Server install errors on Windows platform mapping
- Command smoke checks:
  - new commands appear in manifest
  - wrappers expose help
  - `beeper install --help`
  - `beeper update --help`
  - `beeper setup --help` includes `--target`
- Mock API checks:
  - `target list` includes version when `/v1/info` responds
  - unreachable target does not fail list
  - Desktop update action is always in-app warning
- Read-only checks:
  - install/update commands reject `--read-only`
  - `update --check` is allowed in read-only mode if implemented as no-write
