import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable, isQuiet } from '../../lib/command.js'
import { resolveTarget } from '../../lib/targets.js'
import { ensureCloudflared, startTunnel } from '../../lib/cloudflared.js'
import { ensureDesktopToken } from '../../lib/desktop-auth.js'
import { CLIError, ExitCodes, notReady, usageError } from '../../lib/errors.js'
import { printData } from '../../lib/output.js'
import { formatUpdateFooter, readUpdateAvailability } from '../../lib/update-banner.js'

export default class TargetsTunnel extends BeeperCommand {
  static override summary = 'Expose a local Beeper Desktop API over a public Cloudflare tunnel'
  static override description = `Spawns cloudflared as a quick tunnel pointing at the selected target's Desktop API port and prints the public URL plus the \`beeper targets add\` command another machine can paste to attach.

Foreground command — runs until you press Ctrl+C. The URL is useless without the access token printed alongside it; treat it like a credential.

Only valid for local Desktop targets. Remote targets are already reachable over the network.`
  static override examples = [
    'beeper targets tunnel',
    'beeper targets tunnel --target work',
    'beeper targets tunnel --read-only --as work-mobile',
    'beeper targets tunnel --port 23373',
  ]
  static override flags = {
    as: Flags.string({ description: 'Suggested target name to use on the other machine (printed in the bootstrap command)' }),
    port: Flags.integer({ description: 'Override the Desktop API port to expose (defaults to the target\'s configured port)' }),
    'skip-token': Flags.boolean({ default: false, description: 'Do not mint or print an access token. The remote machine must already have one.' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(TargetsTunnel)
    if (!flags['skip-token']) ensureWritable(flags)

    const target = await resolveTarget({ target: flags.target, baseURL: flags['base-url'] })
    if (target.type === 'remote') {
      throw usageError(`Target "${target.id}" is remote — there is no local API to tunnel.`)
    }
    const url = new URL(target.baseURL)
    const port = flags.port ?? Number.parseInt(url.port || '0', 10)
    if (!port) throw usageError(`Could not determine a port for target "${target.id}".`)

    if (!isQuiet()) process.stderr.write(`Probing ${target.baseURL}...\n`)
    const probe = await fetch(new URL('/v1/info', target.baseURL), { signal: AbortSignal.timeout(3000) })
      .catch(() => undefined)
    if (!probe?.ok) throw notReady(`Could not reach Desktop API at ${target.baseURL}. Start the target first (\`beeper targets start ${target.id}\`).`)

    let token: string | undefined
    if (!flags['skip-token']) {
      if (!isQuiet()) process.stderr.write('Minting tunnel access token...\n')
      const scope = flags['read-only'] ? 'read' : 'read write'
      token = await ensureDesktopToken({
        baseURL: target.baseURL,
        clientName: `Beeper CLI tunnel (${target.id})`,
        openBrowser: false,
        save: false,
        scope,
      })
    }

    if (!isQuiet()) process.stderr.write('Installing cloudflared (if needed)...\n')
    const bin = await ensureCloudflared({ onProgress: msg => { if (!isQuiet()) process.stderr.write(`${msg}\n`) } })

    if (!isQuiet()) process.stderr.write('Starting cloudflared tunnel...\n')
    const tunnel = startTunnel({ bin, port })

    let cleanedUp = false
    const cleanup = (exitCode?: number): void => {
      if (cleanedUp) return
      cleanedUp = true
      tunnel.stop()
      if (typeof exitCode === 'number') process.exit(exitCode)
    }
    process.on('SIGINT', () => cleanup(0))
    process.on('SIGTERM', () => cleanup(0))

    if (flags.debug) tunnel.onLog(line => process.stderr.write(`cloudflared: ${line}\n`))

    try {
      const publicURL = await tunnel.waitForURL(60_000)
      const remoteName = flags.as ?? `${target.id}-remote`
      const addCommand = token
        ? `beeper targets add remote ${remoteName} ${publicURL} --token ${token}`
        : `beeper targets add remote ${remoteName} ${publicURL}`

      if (flags.json) {
        await printData({
          target: target.id,
          url: publicURL,
          port,
          readOnly: !!flags['read-only'],
          token,
          addCommand,
        }, 'json')
      } else {
        const availability = await readUpdateAvailability({ cacheDir: this.config.cacheDir, currentVersion: this.config.version })
        const footer = formatUpdateFooter(availability)
        process.stdout.write([
          '',
          `  tunnel: ${publicURL}`,
          `  target: ${target.id} (${target.baseURL})`,
          `  scope:  ${flags['read-only'] ? 'read-only' : 'read+write'}`,
          '',
          '  attach from another machine:',
          `    ${addCommand}`,
          '',
          '  Press Ctrl+C to stop.',
          ...(footer ? ['', `  ${footer}`] : []),
          '',
        ].join('\n'))
      }

      await new Promise<void>(resolve => {
        tunnel.onStatus(status => {
          if (status.state === 'error') {
            process.stderr.write(`cloudflared error: ${status.message}\n`)
            resolve()
          }
          if (status.state === 'stopped') resolve()
        })
      })
    } catch (error) {
      cleanup()
      if (error instanceof CLIError) throw error
      throw new CLIError(`tunnel failed: ${(error as Error).message}`, ExitCodes.Generic)
    } finally {
      cleanup()
    }
  }
}
