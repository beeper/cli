import { Args, Command } from '@oclif/core'
import { updateConfig } from '../../lib/config.js'

export default class ConfigSet extends Command {
  static override summary = 'Set a CLI configuration value'
  static override args = {
    key: Args.string({ description: 'Config key to set', options: ['baseURL'], required: true }),
    value: Args.string({ description: 'Config value', required: true }),
  }

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigSet)
    await updateConfig(config => ({ ...config, [args.key]: args.value }))
    this.log(`${args.key}=${args.value}`)
  }
}
