import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { startProfile, stopProfile } from '../../lib/profiles.js'
import { resolveTarget } from '../../lib/targets.js'
import { printSuccess } from '../../lib/output.js'

export default class ProfileRestart extends BeeperCommand {
  static override summary = 'Restart a local Beeper profile'
  static override args = {
    profile: Args.string({ required: true }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileRestart)
    ensureWritable(flags)
    const target = await resolveTarget({ target: args.profile })
    await stopProfile(target).catch(() => undefined)
    const run = await startProfile(target)
    await printSuccess({ message: `Restarted profile: ${target.id}`, detail: target.baseURL, data: { target, run } }, flags.json ? 'json' : 'human')
  }
}

