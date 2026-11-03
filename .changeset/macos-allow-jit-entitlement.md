---
'@beeper/cli': patch
---

Sign the macOS binaries with the `allow-jit` entitlement. Without it, Bun runs with its JIT off under the hardened runtime, which makes CPU-heavy JavaScript about 12x slower.
