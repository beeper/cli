---
'@beeper/cli': patch
---

Fix `beeper setup --server --install` timing out on slower connections. The download used a single 120 s deadline for the whole response including the body, so large server archives aborted partway through. The download now allows up to 30 s for the server to respond and up to 120 s of inactivity between chunks, letting slow but advancing downloads finish while still failing stalled ones.
