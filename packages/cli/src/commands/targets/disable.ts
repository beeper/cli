import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { readTarget, resolveTarget } from '../../lib/targets.js'
import { assertServerProfile, disableProfile } from '../../lib/profiles.js'
import { printDryRun, printSuccess } from '../../lib/output.js'

export default class TargetsDisable extends BeeperCommand {
  static override summary = 'Disable a local Beeper Server target at login'
  static override args = { name: Args.string({ required: false, description: 'Target name. Defaults to the selected target.' }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsDisable)
    ensureWritable(flags)
    const target = await resolveTarget({ target: args.name ?? flags.target, baseURL: flags['base-url'] })
    if (!target) throw new Error(`Unknown Beeper target "${args.name}".`)
    assertServerProfile(target)
    if (flags['dry-run']) {
      await printDryRun('targets.disable', { target }, flags.json ? 'json' : 'human')
      return
    }
    const path = await disableProfile(target)
    await printSuccess({ message: `Disabled target at login: ${target.id}`, detail: path, data: { target, path } }, flags.json ? 'json' : 'human')
  }
}
