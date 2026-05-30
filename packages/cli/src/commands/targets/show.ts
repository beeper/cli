import { Args } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { resolveTarget } from '../../lib/targets.js'
import { printData } from '../../lib/output.js'

export default class TargetsShow extends BeeperCommand {
  static override summary = 'Show target details'
  static override args = { name: Args.string({ required: false, description: 'Target name. Defaults to the selected target.' }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsShow)
    const target = await resolveTarget({ target: args.name ?? flags.target, baseURL: flags['base-url'] })
    if (!target) throw new Error(`Unknown Beeper target "${args.name}".`)
    await printData(target, flags.json ? 'json' : 'human')
  }
}
