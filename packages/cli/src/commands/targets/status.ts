import { Args } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { resolveTarget } from '../../lib/targets.js'
import { targetLiveStatus } from '../../lib/target-status.js'
import { printData } from '../../lib/output.js'

export default class TargetsStatus extends BeeperCommand {
  static override summary = 'Check endpoint and process reachability for a target'
  static override args = { name: Args.string({ required: false, description: 'Target name. Defaults to the selected target.' }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsStatus)
    const target = await resolveTarget({ target: args.name ?? flags.target, baseURL: flags['base-url'] })
    if (!target) throw new Error(`Unknown Beeper target "${args.name}".`)
    const status = await targetLiveStatus(target)
    await printData({ target, ...status }, flags.json ? 'json' : 'human')
    if (!status.reachable) process.exitCode = 1
  }
}
