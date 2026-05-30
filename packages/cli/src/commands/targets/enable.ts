import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { resolveTarget } from '../../lib/targets.js'
import { assertServerProfile, enableProfile } from '../../lib/profiles.js'
import { printDryRun, printSuccess } from '../../lib/output.js'

export default class TargetsEnable extends BeeperCommand {
  static override summary = 'Enable a local Beeper Server target at login'
  static override args = { name: Args.string({ required: false, description: 'Target name. Defaults to the selected target.' }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsEnable)
    ensureWritable(flags)
    const target = await resolveTarget({ target: args.name ?? flags.target, baseURL: flags['base-url'] })
    if (!target) throw new Error(`Unknown Beeper target "${args.name}".`)
    assertServerProfile(target)
    if (flags['dry-run']) {
      await printDryRun('targets.enable', { target }, flags.json ? 'json' : 'human')
      return
    }
    const path = await enableProfile(target)
    await printSuccess({ message: `Enabled target at login: ${target.id}`, detail: path, data: { target, path } }, flags.json ? 'json' : 'human')
  }
}
