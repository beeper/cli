---
'@beeper/cli': patch
---

`accounts add --non-interactive` now waits on QR and pairing-code steps instead of exiting after printing the code. Previously nothing completed the sign-in, so WhatsApp linking failed on the phone and the login session stayed at `waiting_for_display`.
