import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { readTarget, resolveTarget } from '../../lib/targets.js'
import { assertServerProfile, stopProfile } from '../../lib/profiles.js'
import { printSuccess } from '../../lib/output.js'

export default class TargetsStop extends BeeperCommand {
  static override summary = 'Stop a local Beeper Server target'
  static override args = { name: Args.string({ required: false, description: 'Target name. Defaults to the selected target.' }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsStop)
    ensureWritable(flags)
    const target = await resolveTarget({ target: args.name ?? flags.target, baseURL: flags['base-url'] })
    if (!target) throw new Error(`Unknown Beeper target "${args.name}".`)
    assertServerProfile(target)
    await stopProfile(target)
    await printSuccess({ message: `Stopped target: ${target.id}`, data: { target } }, flags.json ? 'json' : 'human')
  }
}
