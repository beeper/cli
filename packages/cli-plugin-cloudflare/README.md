# @beeper/cli-plugin-cloudflare

Cloudflare Tunnel commands for Beeper CLI.

```sh
beeper plugins install @beeper/cli-plugin-cloudflare
beeper targets tunnel
```

`targets tunnel` exposes the selected Beeper Desktop or Server API target through
a Cloudflare quick tunnel and keeps the tunnel running until interrupted.

```sh
beeper targets tunnel desktop
beeper targets tunnel --target server
beeper targets tunnel --base-url http://127.0.0.1:23373
beeper targets tunnel --url-only
```

The command uses `cloudflared`. If it is already installed, pass its path:

```sh
BEEPER_CLOUDFLARED_PATH=/opt/homebrew/bin/cloudflared beeper targets tunnel
```

Or let the plugin download the pinned `cloudflared` binary:

```sh
beeper targets tunnel --install
```

Environment overrides:

| Variable | Effect |
| --- | --- |
| `BEEPER_CLOUDFLARED_PATH` | Use this `cloudflared` binary path. |
| `BEEPER_IGNORE_CLOUDFLARED` | Skip install/version checks and try to run the configured binary path directly. |
| `BEEPER_CLOUDFLARED_DOMAIN` | Override the domain used when parsing the public URL from `cloudflared` output. Defaults to `trycloudflare.com`. |

Tunneling makes the Desktop API reachable from the public internet. Only run it
for targets and networks you intend to expose, and stop it with `Ctrl-C` when you
are done.

`targets tunnel` uses Cloudflare quick tunnels. Quick tunnels return temporary
public URLs. For a stable hostname on your own domain, configure a named
Cloudflare Tunnel and public hostname in Cloudflare, then route it to your Beeper
target outside this quick-tunnel command.
