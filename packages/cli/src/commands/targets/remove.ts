import { Args, Flags } from '@oclif/core'
import { readFile } from 'node:fs/promises'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createProfileTarget, listTargets, readConfig, readTarget, removeTarget, resolveTarget, updateConfig, writeTarget, type Target } from '../../lib/targets.js'
import { disableProfile, enableProfile, profileErrorLogPath, profileLogPath, profileStatus, startProfile, stopProfile } from '../../lib/profiles.js'
import { targetLiveStatus } from '../../lib/target-status.js'
import { printData, printSuccess } from '../../lib/output.js'

export default class TargetsRemove extends BeeperCommand {
  static override summary = 'Remove a target'
  static override args = { name: Args.string({ required: true }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsRemove)
    ensureWritable(flags)
    await removeTarget(args.name)
    await printSuccess({ message: `Removed target: ${args.name}`, data: { id: args.name } }, flags.json ? 'json' : 'human')
  }
}
