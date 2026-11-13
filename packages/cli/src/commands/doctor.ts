import { Flags } from '@oclif/core'
import { BeeperCommand } from '../lib/command.js'
import { evaluateReadiness } from '../lib/app-state.js'
import { createClient } from '../lib/client.js'
import { ExitCodes } from '../lib/errors.js'
import { diagnoseAppleMessages } from '../lib/apple-messages.js'
import { resolveTarget } from '../lib/targets.js'
import { targetLiveStatus } from '../lib/target-status.js'
import { printData } from '../lib/output.js'

export default class Doctor extends BeeperCommand {
  static override summary = 'Probe the target live and report diagnostics'
  static override description = 'Active reachability check plus readiness diagnostics. Exits non-zero when the target is not ready. For a cheap snapshot use `beeper status`.'
  static override flags = {
    network: Flags.string({
      options: ['imessage'],
      description: 'Run network-specific diagnostics (currently: imessage)',
    }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Doctor)
    const target = await resolveTarget({ target: flags.target, baseURL: flags['base-url'] })
    const checks: Record<string, unknown> = {
      target: await targetLiveStatus(target),
      readiness: await evaluateReadiness({ baseURL: target.baseURL, target: target.id }),
    }

    const readiness = checks.readiness as Awaited<ReturnType<typeof evaluateReadiness>>
    if (flags.network === 'imessage' && readiness.state === 'ready') {
      checks.appleMessages = await diagnoseAppleMessages(await createClient(flags))
    }

    // Discovery is not proof of active iMessage transport; only target readiness
    // affects the process exit code. Consumers can inspect checks.appleMessages.
    const ok = readiness.state === 'ready'
    await printData({ ok, checks }, flags.json ? 'json' : 'human')
    if (!ok) this.exit(ExitCodes.NotReady)
  }
}
