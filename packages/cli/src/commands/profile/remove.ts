import { Args, Flags } from '@oclif/core'
import { rm } from 'node:fs/promises'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { assertProfile, stopProfile } from '../../lib/profiles.js'
import { removeTarget, resolveTarget } from '../../lib/targets.js'
import { printSuccess } from '../../lib/output.js'

export default class ProfileRemove extends BeeperCommand {
  static override summary = 'Remove a local Beeper profile'
  static override args = {
    profile: Args.string({ required: true }),
  }
  static override flags = {
    force: Flags.boolean({ default: false, description: 'Delete local profile data' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileRemove)
    ensureWritable(flags)
    const target = await resolveTarget({ target: args.profile })
    assertProfile(target)
    await stopProfile(target).catch(() => undefined)
    if (flags.force && target.dataDir) await rm(target.dataDir, { recursive: true, force: true })
    await removeTarget(target.id)
    await printSuccess({ message: `Removed profile: ${target.id}` }, flags.json ? 'json' : 'human')
  }
}

