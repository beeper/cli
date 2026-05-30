import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { readTarget, updateConfig } from '../../lib/targets.js'
import { printDryRun, printSuccess } from '../../lib/output.js'

export default class TargetsUse extends BeeperCommand {
  static override summary = 'Set the default target'
  static override args = { name: Args.string({ required: true, description: 'Target name' }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsUse)
    ensureWritable(flags)
    const target = await readTarget(args.name)
    if (!target) throw new Error(`Unknown Beeper target "${args.name}". Run \`beeper targets list\`.`)
    if (flags['dry-run']) {
      await printDryRun('targets.use', { defaultTarget: target.id, target }, flags.json ? 'json' : 'human')
      return
    }
    await updateConfig(config => ({ ...config, defaultTarget: target.id }))
    await printSuccess({ message: `Using target: ${target.id}`, detail: target.baseURL, data: target }, flags.json ? 'json' : 'human')
  }
}
