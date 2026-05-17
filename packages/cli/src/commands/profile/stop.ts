import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { stopProfile } from '../../lib/profiles.js'
import { resolveTarget } from '../../lib/targets.js'
import { printSuccess } from '../../lib/output.js'

export default class ProfileStop extends BeeperCommand {
  static override summary = 'Stop a local Beeper profile'
  static override args = {
    profile: Args.string({ required: true }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileStop)
    ensureWritable(flags)
    const target = await resolveTarget({ target: args.profile })
    await stopProfile(target)
    await printSuccess({ message: `Stopped profile: ${target.id}` }, flags.json ? 'json' : 'human')
  }
}

