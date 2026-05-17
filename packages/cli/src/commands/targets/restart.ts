import { Args, Flags } from '@oclif/core'
import { readFile } from 'node:fs/promises'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createProfileTarget, listTargets, readConfig, readTarget, removeTarget, resolveTarget, updateConfig, writeTarget, type Target } from '../../lib/targets.js'
import { disableProfile, enableProfile, profileErrorLogPath, profileLogPath, profileStatus, startProfile, stopProfile } from '../../lib/profiles.js'
import { targetLiveStatus } from '../../lib/target-status.js'
import { printData, printSuccess } from '../../lib/output.js'

export default class TargetsRestart extends BeeperCommand {
  static override summary = 'Restart a managed target'
  static override args = { name: Args.string({ required: false }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsRestart)
    ensureWritable(flags)
    const target = args.name ? await readTarget(args.name) : await resolveTarget({ target: flags.target, baseURL: flags['base-url'] })
    if (!target) throw new Error(`Unknown Beeper target "${args.name}".`)
    if (!target.managed) throw new Error(`Target "${target.id}" is remote and cannot be restarted locally.`)
    await stopProfile(target).catch(() => undefined); const result = await startProfile(target); await printSuccess({ message: `Restarted target: ${target.id}`, detail: target.baseURL, data: { target, result } }, flags.json ? 'json' : 'human')
  }
}
