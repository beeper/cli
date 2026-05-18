import { Args, Flags } from '@oclif/core'
import { readFile } from 'node:fs/promises'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createProfileTarget, listTargets, readConfig, readTarget, removeTarget, resolveTarget, updateConfig, writeTarget, type Target } from '../../lib/targets.js'
import { disableProfile, enableProfile, profileErrorLogPath, profileLogPath, profileStatus, startProfile, stopProfile } from '../../lib/profiles.js'
import { targetLiveStatus } from '../../lib/target-status.js'
import { printData, printSuccess } from '../../lib/output.js'

export default class TargetsDisable extends BeeperCommand {
  static override summary = 'Disable managed target startup at login'
  static override args = { name: Args.string({ required: false, description: 'Target name. Defaults to the selected target.' }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsDisable)
    ensureWritable(flags)
    const target = args.name ? await readTarget(args.name) : await resolveTarget({ target: flags.target, baseURL: flags['base-url'] })
    if (!target) throw new Error(`Unknown Beeper target "${args.name}".`)
    if (!target.managed) throw new Error(`Target "${target.id}" is remote and cannot be disabled locally.`)
    const path = await disableProfile(target); await printSuccess({ message: `Disabled target at login: ${target.id}`, detail: path, data: { target, path } }, flags.json ? 'json' : 'human')
  }
}
