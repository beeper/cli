import { BeeperCommand } from '../lib/command.js'
import { evaluateReadiness } from '../lib/app-state.js'
import { ExitCodes } from '../lib/errors.js'
import { resolveTarget } from '../lib/targets.js'
import { targetLiveStatus } from '../lib/target-status.js'
import { printData } from '../lib/output.js'
export default class Doctor extends BeeperCommand {
  static override summary = 'Probe the target live and report diagnostics'
  static override description = 'Active reachability check plus readiness diagnostics. Exits non-zero when the target is not ready. For a cheap snapshot use `beeper status`.'
  async run(): Promise<void> {
    const { flags } = await this.parse(Doctor)
    const target = await resolveTarget({ target: flags.target, baseURL: flags['base-url'] })
    const checks = { target: await targetLiveStatus(target), readiness: await evaluateReadiness({ baseURL: target.baseURL, target: target.id }) }
    await printData({ ok: checks.readiness.state === 'ready', checks }, flags.json ? 'json' : 'human')
    if (checks.readiness.state !== 'ready') this.exit(ExitCodes.NotReady)
  }
}
