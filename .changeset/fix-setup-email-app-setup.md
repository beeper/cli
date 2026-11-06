---
'@beeper/cli': patch
---

Fix headless `beeper setup --email` against `@beeper/desktop-api` 6.0.0.

The SDK moved `client.app.login` to `client.app.setup` and moved verification and recovery-key calls under that resource. Email setup now calls those methods, and the dependency is pinned to the 6.0.0 commit instead of the moving `next` branch.
