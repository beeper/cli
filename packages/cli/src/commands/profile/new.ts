import { Args, Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createProfileTarget, readTarget, updateConfig, type Target } from '../../lib/targets.js'
import { printSuccess } from '../../lib/output.js'

export default class ProfileNew extends BeeperCommand {
  static override summary = 'Create a local Beeper profile'
  static override args = {
    type: Args.string({ required: true, options: ['desktop', 'server'] }),
    name: Args.string({ required: false }),
  }
  static override flags = {
    'server-env': Flags.string({ options: ['production', 'staging'], default: 'production' }),
    port: Flags.integer(),
    default: Flags.boolean({ default: false, description: 'Make this the default target' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileNew)
    ensureWritable(flags)
    const id = args.name ?? args.type
    if (await readTarget(id)) throw new Error(`Target "${id}" already exists.`)
    const target = await createProfileTarget(args.type as Target['type'], id, { serverEnv: flags['server-env'], port: flags.port })
    if (flags.default) await updateConfig(config => ({ ...config, defaultTarget: target.id }))
    await printSuccess({ message: `Created ${target.type} profile: ${target.id}`, detail: target.baseURL, data: target }, flags.json ? 'json' : 'human')
  }
}

