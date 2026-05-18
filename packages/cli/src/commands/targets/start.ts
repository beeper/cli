import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { customTargetID, readTarget, resolveTarget } from '../../lib/targets.js'
import { launchDesktopApp, startProfile } from '../../lib/profiles.js'
import { printSuccess } from '../../lib/output.js'

export default class TargetsStart extends BeeperCommand {
  static override summary = 'Start a local Server target or open Beeper Desktop'
  static override args = { name: Args.string({ required: false, description: 'Target name. Defaults to the selected target.' }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsStart)
    ensureWritable(flags)
    const target = await resolveTarget({ target: args.name ?? flags.target, baseURL: flags['base-url'] })
    if (!target) throw new Error(`Unknown Beeper target "${args.name}".`)
    if (target.type === 'desktop' && target.id !== customTargetID) {
      const result = await launchDesktopApp(target.managed ? target : undefined)
      await printSuccess({ message: 'Opened Beeper Desktop', detail: target.baseURL, data: { target, result } }, flags.json ? 'json' : 'human')
      return
    }
    if (!target.managed || target.type !== 'server') {
      throw new Error(`Target "${target.id}" is not a local Beeper Server install.`)
    }
    const result = await startProfile(target)
    await printSuccess({ message: `Started target: ${target.id}`, detail: target.baseURL, data: { target, result } }, flags.json ? 'json' : 'human')
  }
}
