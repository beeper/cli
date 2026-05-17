import { Args, Flags } from '@oclif/core'
import { readFile } from 'node:fs/promises'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createProfileTarget, listTargets, readConfig, readTarget, removeTarget, resolveTarget, updateConfig, writeTarget, type Target } from '../../lib/targets.js'
import { disableProfile, enableProfile, profileErrorLogPath, profileLogPath, profileStatus, startProfile, stopProfile } from '../../lib/profiles.js'
import { targetLiveStatus } from '../../lib/target-status.js'
import { printData, printSuccess } from '../../lib/output.js'

export default class TargetsUse extends BeeperCommand {
  static override summary = 'Set the default target'
  static override args = { name: Args.string({ required: true }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsUse)
    ensureWritable(flags)
    const target = await readTarget(args.name)
    if (!target) throw new Error(`Unknown Beeper target "${args.name}". Run \`beeper targets list\`.`)
    await updateConfig(config => ({ ...config, defaultTarget: target.id }))
    await printSuccess({ message: `Using target: ${target.id}`, detail: target.baseURL, data: target }, flags.json ? 'json' : 'human')
  }
}
