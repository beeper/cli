---
'@beeper/cli': patch
---

Clarify that `setup --desktop` creates a separate CLI-managed Desktop profile on its own port, and point to `--local` for an already-running Desktop. When starting that profile throws, print the error as a warning instead of discarding it. Setup still continues to the readiness check.
