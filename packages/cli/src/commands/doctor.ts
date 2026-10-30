import { Flags } from '@oclif/core'
import { BeeperCommand } from '../lib/command.js'
import { evaluateReadiness } from '../lib/app-state.js'
import { createClient } from '../lib/client.js'
import { diagnoseDataIntegrity } from '../lib/data-integrity.js'
import { ExitCodes } from '../lib/errors.js'
import { resolveTarget } from '../lib/targets.js'
import { targetLiveStatus } from '../lib/target-status.js'
import { printData } from '../lib/output.js'

export default class Doctor extends BeeperCommand {
  static override summary = 'Probe the target live and report diagnostics'
  static override description = 'Active reachability check plus readiness diagnostics. Exits non-zero when the target is not ready. For a cheap snapshot use `beeper status`.'
  static override flags = {
    data: Flags.boolean({
      default: false,
      description: 'Cross-check accounts, chats, messages, bridges, and bridge logins for data-plane drift',
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
    if (flags.data && readiness.state === 'ready') {
      checks.dataIntegrity = await diagnoseDataIntegrity(await createClient(flags))
    }

    await printData({ ok: readiness.state === 'ready', checks }, flags.json ? 'json' : 'human')
    if (readiness.state !== 'ready') this.exit(ExitCodes.NotReady)
  }
}
