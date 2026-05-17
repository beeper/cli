import { Args } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { profileStatus } from '../../lib/profiles.js'
import { resolveTarget } from '../../lib/targets.js'
import { printData } from '../../lib/output.js'

export default class ProfileStatus extends BeeperCommand {
  static override summary = 'Show local Beeper profile status'
  static override args = {
    profile: Args.string({ required: true }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileStatus)
    const target = await resolveTarget({ target: args.profile })
    await printData(await profileStatus(target), flags.json ? 'json' : 'human')
  }
}

