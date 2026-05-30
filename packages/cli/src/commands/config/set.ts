import { Args } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { updateConfig } from '../../lib/targets.js'
import { printDryRun, printSuccess } from '../../lib/output.js'

export default class ConfigSet extends BeeperCommand {
  static override summary = 'Set a CLI configuration value'
  static override args = {
    key: Args.string({ description: 'Config key to set', options: ['defaultTarget', 'defaultAccount'], required: true }),
    value: Args.string({ description: 'Config value (pass "" to clear)', required: true }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConfigSet)
    ensureWritable(flags)
    const nextValue = args.value === '' ? undefined : args.value
    if (flags['dry-run']) {
      await printDryRun('config.set', { [args.key]: nextValue }, flags.json ? 'json' : 'human')
      return
    }
    await updateConfig(config => ({ ...config, [args.key]: nextValue }))
    await printSuccess({
      message: nextValue === undefined ? `Cleared ${args.key}` : `Set ${args.key}`,
      detail: nextValue,
      data: { [args.key]: nextValue },
    }, flags.json ? 'json' : 'human')
  }
}
