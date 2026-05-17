import { Args, Flags, BeeperCommand, ensureWritable, printData, printSuccess, resolveTarget, writeEvent } from 'beeper-cli/plugin-sdk'
import { cloudflaredPath, startCloudflareTunnel } from '../../lib/cloudflared.js'

export default class TargetsTunnel extends BeeperCommand {
  static override summary = 'Expose a Beeper target through Cloudflare Tunnel'
  static override description = 'Starts a Cloudflare quick tunnel for the selected Beeper Desktop or Server API target. The command stays in the foreground until interrupted.'
  static override args = {
    name: Args.string({ required: false, description: 'Target name. Defaults to the selected target.' }),
  }
  static override flags = {
    install: Flags.boolean({ default: false, description: 'Download the pinned cloudflared binary if it is missing or outdated' }),
    'cloudflared-path': Flags.string({ description: 'Path to a cloudflared binary. Also configurable with BEEPER_CLOUDFLARED_PATH.' }),
    retries: Flags.integer({ default: 5, description: 'Number of startup retries before giving up' }),
    'url-only': Flags.boolean({ default: false, description: 'Print only the public tunnel URL' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsTunnel)
    if (flags.install) ensureWritable(flags)
    const target = await resolveTarget({ target: args.name ?? flags.target, baseURL: flags['base-url'] })
    const localURL = normalizeLocalURL(target.baseURL)
    const started = await startCloudflareTunnel({
      cloudflaredPath: flags['cloudflared-path'],
      debug: flags.debug,
      install: flags.install,
      retries: flags.retries,
      timeoutMs: parseTimeout(flags.timeout) ?? 40_000,
      url: localURL,
    })

    if (flags.events) writeEvent('tunnel.connected', { target: target.id, localURL, url: started.url })

    if (flags['url-only']) {
      process.stdout.write(`${started.url}\n`)
    } else if (flags.json) {
      await printData({ target: target.id, localURL, url: started.url, cloudflaredPath: cloudflaredPath(flags['cloudflared-path']) }, 'json')
    } else {
      await printSuccess({
        message: `Cloudflare Tunnel connected for ${target.id}`,
        detail: `${started.url} -> ${localURL}`,
        data: { target: target.id, localURL, url: started.url },
      }, 'human')
      process.stderr.write('Press Ctrl-C to stop the tunnel.\n')
    }

    await waitForExit(started.stop)
  }
}

function normalizeLocalURL(value: string): string {
  const url = new URL(value)
  url.pathname = url.pathname === '/' ? '/' : url.pathname
  url.search = ''
  url.hash = ''
  return url.toString().replace(/\/$/, '')
}

function parseTimeout(value?: string): number | undefined {
  if (!value) return undefined
  const match = value.trim().match(/^(\d+(?:\.\d+)?)(ms|s|m)?$/i)
  if (!match) throw new Error(`Invalid --timeout value "${value}". Use values like 500ms, 30s, or 2m.`)
  const amount = Number(match[1])
  const unit = (match[2] ?? 'ms').toLowerCase()
  if (unit === 'ms') return amount
  if (unit === 's') return amount * 1000
  if (unit === 'm') return amount * 60_000
  return amount
}

async function waitForExit(stop: () => void): Promise<void> {
  await new Promise<void>(resolve => {
    const finish = () => {
      stop()
      resolve()
    }
    process.once('SIGINT', finish)
    process.once('SIGTERM', finish)
  })
}
