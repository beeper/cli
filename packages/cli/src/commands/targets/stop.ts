import { Args, Flags } from '@oclif/core'
import { readFile } from 'node:fs/promises'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createProfileTarget, listTargets, readConfig, readTarget, removeTarget, resolveTarget, updateConfig, writeTarget, type Target } from '../../lib/targets.js'
import { disableProfile, enableProfile, profileErrorLogPath, profileLogPath, profileStatus, startProfile, stopProfile } from '../../lib/profiles.js'
import { targetLiveStatus } from '../../lib/target-status.js'
import { printData, printSuccess } from '../../lib/output.js'

export default class TargetsStop extends BeeperCommand {
  static override summary = 'Stop a managed target'
  static override args = { name: Args.string({ required: false }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsStop)
    ensureWritable(flags)
    const target = args.name ? await readTarget(args.name) : await resolveTarget({ target: flags.target, baseURL: flags['base-url'] })
    if (!target) throw new Error(`Unknown Beeper target "${args.name}".`)
    if (!target.managed) throw new Error(`Target "${target.id}" is remote and cannot be stoped locally.`)
    await stopProfile(target); await printSuccess({ message: `Stopped target: ${target.id}`, data: { target } }, flags.json ? 'json' : 'human')
  }
}
