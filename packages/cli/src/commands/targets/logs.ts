import { Args, Flags } from '@oclif/core'
import { readFile } from 'node:fs/promises'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createProfileTarget, listTargets, readConfig, readTarget, removeTarget, resolveTarget, updateConfig, writeTarget, type Target } from '../../lib/targets.js'
import { disableProfile, enableProfile, profileErrorLogPath, profileLogPath, profileStatus, startProfile, stopProfile } from '../../lib/profiles.js'
import { targetLiveStatus } from '../../lib/target-status.js'
import { printData, printSuccess } from '../../lib/output.js'

export default class TargetsLogs extends BeeperCommand {
  static override summary = 'Print managed target logs'
  static override args = { name: Args.string({ required: false }) }
  async run(): Promise<void> {
    const { args } = await this.parse(TargetsLogs)
    const target = args.name ? await readTarget(args.name) : await resolveTarget()
    if (!target) throw new Error(`Unknown Beeper target "${args.name}".`)
    if (!target.managed) throw new Error(`Target "${target.id}" is remote and has no local logs.`)
    process.stdout.write(await readFile(profileLogPath(target.id), 'utf8').catch(() => ''))
    process.stdout.write(await readFile(profileErrorLogPath(target.id), 'utf8').catch(() => ''))
  }
}
