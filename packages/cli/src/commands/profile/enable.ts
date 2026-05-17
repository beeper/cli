import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { enableProfile } from '../../lib/profiles.js'
import { resolveTarget } from '../../lib/targets.js'
import { printSuccess } from '../../lib/output.js'

export default class ProfileEnable extends BeeperCommand {
  static override summary = 'Start a local Beeper server profile at login'
  static override args = {
    profile: Args.string({ required: true }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileEnable)
    ensureWritable(flags)
    const target = await resolveTarget({ target: args.profile })
    const path = await enableProfile(target)
    await printSuccess({ message: `Enabled profile at login: ${target.id}`, detail: path, data: { path } }, flags.json ? 'json' : 'human')
  }
}

