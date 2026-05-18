# Beeper CLI Setup Redesign Plan

## Goal

`beeper setup` should make Beeper CLI usable with the least possible explanation.

For most Desktop users, the happy path should be:

```sh
beeper setup
```

Then:

```txt
Found Beeper Desktop on this device.

Signed in as: you@beeper.com
Connected accounts: iMessage, WhatsApp, Signal

Use this Desktop session for CLI access? [Y/n]
```

Pressing Enter should leave the CLI ready.

## Critique Of The Draft

The intern proposal has the right product instinct, but it over-expands the public surface.

Keep:

- Desktop-first setup.
- Local Desktop session as the recommended path.
- OAuth/PKCE as the limited-permission path.
- Remote Desktop/Server setup.
- Install Desktop/Server from setup when explicitly confirmed.
- Concrete prompts that show the detected account and connected accounts.
- Every interactive choice having a command or flag equivalent.

Reject or defer:

- A new public `connections` model. The CLI already has targets; use them.
- `beeper auth list/use/desktop/remote/manual` in the first pass. That recreates target management under another noun.
- Public `beeper setup desktop|server|remote|manual` subcommands for v1. They are redundant if flags and existing target/install commands exist.
- Keychain as a blocker. Store like the current CLI first, add keychain later.
- Email-code setup flags as the main Desktop experience. Normal users receive codes asynchronously, and installed Desktop may not expose the setup-login routes. Desktop login should be driven by Desktop itself unless the Server/headless API explicitly supports the flow.

## Product Model

Use one object: **target**.

A target is a runnable or reachable Beeper endpoint/profile:

- Built-in local Desktop target: `desktop`
- Managed Desktop profile: `targets create desktop <name>`
- Managed Server profile: `targets create server <name>`
- Remote Desktop or Server: `targets add remote <name> <url>`
- One-off URL: `--base-url`

Auth is target-scoped metadata, not a separate public object.

`setup` is the guided orchestrator that creates, selects, starts, installs, and authenticates targets by calling the same primitives users can run directly.

## Public Command Shape

Keep the public command tree narrow:

```sh
beeper setup
beeper setup --local
beeper setup --oauth
beeper setup --remote URL
beeper setup --server
beeper setup --desktop
beeper setup --install
beeper setup --yes

beeper targets ...
beeper install desktop
beeper install server
beeper auth status
beeper auth logout
beeper verify ...
beeper doctor
```

Do not add these in the first pass:

```sh
beeper setup desktop
beeper setup server
beeper setup remote
beeper auth list
beeper auth use
beeper auth desktop
beeper auth remote
beeper auth manual
```

If we later need script-focused auth commands, add them only after targets/setup prove insufficient.

## Setup Modes

### `beeper setup`

Interactive, magical default.

Detection order:

1. Existing configured default target.
2. Detected local Beeper Desktop.
3. Running local Desktop API.
4. Desktop login/session state.
5. Local Desktop DB/cache/session token availability.
6. Connected accounts via Desktop API when reachable.
7. Managed Server install/config.
8. Remote URL from env/config.

Behavior:

- If a ready target already exists, show it and offer to keep, repair, switch, or add another target.
- If local Desktop is signed in and local session auth is readable, recommend direct Desktop connection.
- If local Desktop is installed but logged out, launch Desktop and ask the user to sign in there.
- If Desktop is missing, offer Desktop install only on supported GUI platforms.
- If Server is requested or Desktop is unsuitable, offer Server install/setup.
- If remote URL is supplied or selected, use PKCE against that target.

### `beeper setup --local`

Explicit local Desktop DB/cache/session path.

Use when:

- Desktop is installed locally.
- The user wants the fastest trusted-device path.
- QA wants to test the direct local Desktop flow without menu interaction.

This should:

1. Detect Desktop app/profile.
2. Read local session/token from Desktop state.
3. Materialize or update target `desktop`.
4. Store target auth with `source: "desktop-db"` or `source: "desktop-cache"`.
5. Fetch readiness and connected accounts.

### `beeper setup --oauth`

Explicit browser-authorized path for the resolved target.

Use when:

- The user wants limited/revocable permissions.
- The target is remote.
- Local Desktop DB/cache auth is unavailable or declined.

This should use the existing PKCE implementation and store auth with:

```ts
source: "desktop-oauth" | "remote-oauth"
```

### `beeper setup --remote URL`

Shortcut for:

1. Create or update a remote target for `URL`.
2. Use OAuth/PKCE.
3. Optionally make it default after confirmation.

Equivalent primitive path:

```sh
beeper targets add remote <name> <url>
beeper setup -t <name> --oauth
beeper targets use <name>
```

### `beeper setup --server`

Guided Server setup.

If no local server binary exists:

- Prompt to install.
- Require `--install --yes` for non-interactive download/install.
- Use staging only when requested by target/server env flags in tests.

Equivalent primitive path:

```sh
beeper install server
beeper targets create server <name>
beeper targets start <name>
beeper setup -t <name> --oauth
```

### `beeper setup --desktop --install`

Guided Desktop install/setup.

Equivalent primitive path:

```sh
beeper install desktop
beeper targets create desktop <name>
beeper targets start <name>
beeper setup -t <name> --local
```

## Target Schema

Extend the current target model; do not create a separate connection schema.

```ts
type AuthSource =
  | "desktop-db"
  | "desktop-cache"
  | "desktop-oauth"
  | "remote-oauth"
  | "manual";

type StoredAuth = {
  accessToken: string;
  clientID?: string;
  expiresAt?: string;
  scope?: string;
  tokenType: "Bearer";
  source?: AuthSource;
};
```

Target records should contain stable endpoint/profile/runtime metadata.

Volatile facts should go in cache:

- Desktop app version.
- Reachability.
- Current signed-in user.
- Connected account summary.
- Readiness state.

## Built-In Desktop Target

Stop creating `personal`.

Use `desktop` as the built-in local Desktop target when a selector is needed.

User-facing UI should not lead with the ID:

```txt
Current connection:
  Beeper Desktop v4.2.842 on this device
  connected directly
```

For named targets, use target language:

```txt
Default target:
  work-server
  Remote Beeper Server
  https://beeper.example.com
```

`beeper targets list` may show:

```txt
Built-in:
  desktop       Beeper Desktop on this device      connected directly

Targets:
  work-server   remote server                      https://beeper.example.com
  local-server  managed server                     http://127.0.0.1:23374
```

Removing `desktop` means forget CLI state only. Do not uninstall Desktop, delete Desktop data, or revoke anything remote unless a separate explicit command asks for it.

## UX Copy

Avoid scary or implementation-first language in the main path.

Avoid:

- full access
- unrestricted
- extract token
- scrape database
- read DB

Use:

- Use your existing Desktop session.
- Connect directly to Beeper Desktop.
- Authorize with browser.
- Limited permissions.
- Connected accounts.

Advanced/debug output can be explicit:

```txt
Auth source: desktop-db
Requests: Desktop API at http://127.0.0.1:23373
```

## Readiness And Repair

`setup`, `status`, `doctor`, and `verify` must share the same readiness evaluator.

States:

```txt
no-target
target-unreachable
needs-login
login-in-progress
initializing
needs-cross-signing-setup
needs-verification
verification-in-progress
needs-recovery-key
needs-secrets
needs-first-sync
ready
error
```

Setup should never dead-end on these states. It should show the next repair action:

- `target-unreachable`: start target, install runtime, or fix URL.
- `needs-login`: Desktop users sign in in Desktop; Server/headless may use supported setup API if available.
- `needs-verification`: run or continue `verify`.
- `needs-recovery-key` / `needs-secrets`: run recovery-key flow.
- `needs-first-sync`: wait with events, and resume on rerun.

Ctrl+C while waiting should not cancel remote verification or sync. Print:

```txt
Run `beeper setup` to continue.
```

## Non-Interactive Contract

No prompts when:

- `--json`
- non-TTY
- `--yes`

If blocked on a human action, return JSON error on stderr:

```json
{"success":false,"data":null,"error":"Desktop sign-in required"}
```

Include current state and available actions in `data` when possible.

Downloads/installs require:

```sh
--install --yes
```

## Implementation Plan

1. Revert public email/code setup flags from the main UX.
   - Do not make OTP login the normal Desktop setup path.
   - Keep any Server/headless setup API helper internal until verified against live Server.

2. Replace `personal` with built-in `desktop`.
   - Materialize `desktop` when detected or selected.
   - Update `resolveTarget`, `targets list`, `targets remove`, setup docs, and smoke tests.

3. Add auth source metadata.
   - Extend `StoredAuth.source`.
   - Populate for local Desktop, Desktop OAuth, remote OAuth, and manual token paths.

4. Implement local Desktop direct auth.
   - Inspect Desktop app/profile/session state.
   - Read Matrix access token from local Desktop state/cache using structured storage access, not ad hoc text parsing.
   - Cache target auth and verify with Desktop API or Matrix-backed API calls.
   - Show connected accounts before confirmation when possible.

5. Keep OAuth as setup mode, not auth namespace sprawl.
   - Add `setup --oauth`.
   - Reuse existing PKCE implementation.
   - Support `setup -t <target> --oauth` and `setup --remote URL`.

6. Make setup orchestrate installs.
   - Use existing `install desktop` and `install server`.
   - Never download in non-interactive mode without `--install --yes`.
   - Preserve `--server-env staging` for tests.

7. Use primitives for direct testing.
   - `targets create/start/status/logs`
   - `install desktop/server`
   - `setup --local`
   - `setup --oauth`
   - `setup --remote`
   - `verify ...`

8. Keep `auth` narrow.
   - `auth status`
   - `auth logout`
   - Add revoke/list/use only if target commands cannot cover the need.

9. Regenerate docs from metadata.
   - README and man output should describe `setup` as guided orchestration.
   - Advanced examples should show primitive equivalents.

10. Update E2E staging scripts.
    - Test primitives directly first.
    - Test `beeper setup` as a shortcut over those primitives.
    - Fail fast on required phase failures.
    - Continue to isolate config, ports, and profiles from the default Desktop instance.

## Test Plan

### Local Unit/Smoke

- Command tree still matches the nuclear redesign.
- No new public `auth login/list/use` unless deliberately added.
- `setup --json` returns stable envelopes.
- `setup --read-only` refuses writes.
- `setup --install --yes` is required for downloads.
- `targets list` shows built-in Desktop distinctly from named targets.
- `targets remove desktop` forgets CLI state only.

### Local Desktop

- Running signed-in Desktop:
  - `setup --local` detects user and connected accounts.
  - Auth source is `desktop-db` or `desktop-cache`.
  - `status`, `accounts list`, `chats list` work through the configured target.

- Installed but logged-out Desktop:
  - `setup` launches or points to Desktop sign-in.
  - Rerunning `setup` resumes after sign-in.

- No Desktop:
  - `setup` offers install only where supported.
  - Non-interactive mode returns actionable JSON instead of prompting.

### OAuth / Remote

- `setup --oauth` uses PKCE for the resolved target.
- `setup --remote URL` creates/updates a remote target and authenticates.
- Remote targets reject local runtime commands with clear errors.

### Server

- `install server --server-env staging` installs the staging binary.
- `targets create server/start/status/logs/stop` work.
- `setup -t <server> --oauth` works when Server supports PKCE.
- Server/headless email-code setup is tested only through verified supported routes, not assumed from Desktop.

### Multi-Target Staging

- Create three isolated targets:
  - one managed Desktop profile
  - two managed Server profiles
- Use `qatest+<digits>@beeper.com` accounts and provide the QA OTP via `BEEPER_E2E_OTP` only in the scripts that target verified setup APIs.
- Start all targets on non-default ports.
- Authenticate each target through the appropriate setup mode.
- Run device-to-device verification between two signed-in targets.
- Send messages between targets.
- Cleanup stops managed Server targets and records any Desktop target that must be quit manually.

## Acceptance Criteria

- `beeper setup` feels like a product wizard, not an API debugger.
- The default Desktop path succeeds without asking users to understand tokens, ports, profiles, or OAuth.
- Every wizard choice has a direct command or flag equivalent.
- The public model remains one target system, not targets plus connections.
- E2E scripts test direct primitives and then setup shortcuts.
- The default Desktop instance is never modified during staging tests unless explicitly requested.
