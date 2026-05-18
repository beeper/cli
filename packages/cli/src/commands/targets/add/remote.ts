import { Args, Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../../lib/command.js'
import { readTarget, updateConfig, writeTarget, type Target } from '../../../lib/targets.js'
import { printSuccess } from '../../../lib/output.js'

export default class TargetsAddRemote extends BeeperCommand {
  static override summary = 'Add a remote Beeper Desktop or Server target'
  static override args = {
    name: Args.string({ required: true, description: 'Local name for the target' }),
    url: Args.string({ required: true, description: 'Base URL of the remote Desktop or Server API' }),
  }
  static override flags = {
    default: Flags.boolean({ default: false, description: 'Set this target as the default after creation' }),
  }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsAddRemote)
    ensureWritable(flags)
    if (await readTarget(args.name)) throw new Error(`Target "${args.name}" already exists.`)
    const target: Target = { id: args.name, name: args.name, type: 'remote', baseURL: args.url, managed: false }
    await writeTarget(target)
    if (flags.default) await updateConfig(config => ({ ...config, defaultTarget: target.id }))
    await printSuccess({ message: `Added target: ${target.id}`, detail: target.baseURL, data: target }, flags.json ? 'json' : 'human')
  }
}
