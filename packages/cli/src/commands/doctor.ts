import { BeeperCommand } from '../lib/command.js'
import { evaluateReadiness } from '../lib/app-state.js'
import { resolveTarget } from '../lib/targets.js'
import { targetLiveStatus } from '../lib/target-status.js'
import { printData } from '../lib/output.js'
export default class Doctor extends BeeperCommand {
  static override summary = 'Check target readiness'
  async run(): Promise<void> {
    const { flags } = await this.parse(Doctor)
    const target = await resolveTarget({ target: flags.target, baseURL: flags['base-url'] })
    const checks = { target: await targetLiveStatus(target), readiness: await evaluateReadiness({ baseURL: target.baseURL, target: target.id }) }
    await printData({ ok: checks.readiness.state === 'ready', checks }, flags.json ? 'json' : 'human')
    if (checks.readiness.state !== 'ready') this.exit(1)
  }
}
