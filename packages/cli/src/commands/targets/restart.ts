import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { readTarget, resolveTarget } from '../../lib/targets.js'
import { assertServerProfile, startProfile, stopProfile } from '../../lib/profiles.js'
import { printDryRun, printSuccess } from '../../lib/output.js'

export default class TargetsRestart extends BeeperCommand {
  static override summary = 'Restart a local Beeper Server target'
  static override args = { name: Args.string({ required: false, description: 'Target name. Defaults to the selected target.' }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsRestart)
    ensureWritable(flags)
    const target = await resolveTarget({ target: args.name ?? flags.target, baseURL: flags['base-url'] })
    if (!target) throw new Error(`Unknown Beeper target "${args.name}".`)
    assertServerProfile(target)
    if (flags['dry-run']) {
      await printDryRun('targets.restart', { target }, flags.json ? 'json' : 'human')
      return
    }
    await stopProfile(target).catch(() => undefined)
    const result = await startProfile(target)
    await printSuccess({ message: `Restarted target: ${target.id}`, detail: target.baseURL, data: { target, result } }, flags.json ? 'json' : 'human')
  }
}
