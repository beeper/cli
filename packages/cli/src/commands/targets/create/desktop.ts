import { Args, Flags } from '@oclif/core'
import { readFile } from 'node:fs/promises'
import { BeeperCommand, ensureWritable } from '../../../lib/command.js'
import { createProfileTarget, readTarget, updateConfig } from '../../../lib/targets.js'
import { printSuccess } from '../../../lib/output.js'

export default class TargetsCreateDesktop extends BeeperCommand {
  static override summary = 'Create a managed Desktop target'
  static override args = { name: Args.string({ required: false }) }
  static override flags = { port: Flags.integer(), default: Flags.boolean({ default: false }), 'server-env': Flags.string({ options: ['production', 'staging'], default: 'production' }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(TargetsCreateDesktop)
    ensureWritable(flags)
    const id = args.name ?? 'personal'
    if (await readTarget(id)) throw new Error(`Target "${id}" already exists.`)
    const target = await createProfileTarget('desktop', id, { serverEnv: flags['server-env'], port: flags.port })
    if (flags.default) await updateConfig(config => ({ ...config, defaultTarget: target.id }))
    await printSuccess({ message: `Created target: ${target.id}`, detail: target.baseURL, data: target }, flags.json ? 'json' : 'human')
  }
}
