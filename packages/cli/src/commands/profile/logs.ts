import { Args } from '@oclif/core'
import { readFile } from 'node:fs/promises'
import { BeeperCommand } from '../../lib/command.js'
import { profileErrorLogPath, profileLogPath, assertProfile } from '../../lib/profiles.js'
import { resolveTarget } from '../../lib/targets.js'

export default class ProfileLogs extends BeeperCommand {
  static override summary = 'Print local Beeper profile logs'
  static override args = {
    profile: Args.string({ required: true }),
  }

  async run(): Promise<void> {
    const { args } = await this.parse(ProfileLogs)
    const target = await resolveTarget({ target: args.profile })
    assertProfile(target)
    const out = await readFile(profileLogPath(target.id), 'utf8').catch(() => '')
    const err = await readFile(profileErrorLogPath(target.id), 'utf8').catch(() => '')
    process.stdout.write(out)
    process.stdout.write(err)
  }
}

