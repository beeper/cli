import { Args, Command, Flags } from '@oclif/core'
import { readConfig } from '../../lib/config.js'
import { printData } from '../../lib/output.js'

export default class ConfigGet extends Command {
  static override summary = 'Print CLI configuration'
  static override args = {
    key: Args.string({ description: 'Optional config key to print', options: ['baseURL', 'auth'], required: false }),
  }
  static override flags = {
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConfigGet)
    const config = await readConfig()
    const value = args.key ? config[args.key as 'baseURL' | 'auth'] : config
    printData(value, flags.json ? 'json' : 'human')
  }
}
