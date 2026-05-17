import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { disableProfile } from '../../lib/profiles.js'
import { resolveTarget } from '../../lib/targets.js'
import { printSuccess } from '../../lib/output.js'

export default class ProfileDisable extends BeeperCommand {
  static override summary = 'Disable login start for a local Beeper server profile'
  static override args = {
    profile: Args.string({ required: true }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileDisable)
    ensureWritable(flags)
    const target = await resolveTarget({ target: args.profile })
    const path = await disableProfile(target)
    await printSuccess({ message: `Disabled login start for profile: ${target.id}`, detail: path, data: { path } }, flags.json ? 'json' : 'human')
  }
}

