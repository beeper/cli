import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { startProfile } from '../../lib/profiles.js'
import { resolveTarget } from '../../lib/targets.js'
import { printSuccess } from '../../lib/output.js'

export default class ProfileStart extends BeeperCommand {
  static override summary = 'Start a local Beeper profile'
  static override args = {
    profile: Args.string({ required: true }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileStart)
    ensureWritable(flags)
    const target = await resolveTarget({ target: args.profile })
    const run = await startProfile(target)
    await printSuccess({ message: `Started profile: ${target.id}`, detail: target.baseURL, data: { target, run } }, flags.json ? 'json' : 'human')
  }
}

