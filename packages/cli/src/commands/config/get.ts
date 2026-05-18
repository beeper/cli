import { Args } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { readConfig } from '../../lib/targets.js'
import { printConfig, printData } from '../../lib/output.js'

export default class ConfigGet extends BeeperCommand {
  static override summary = 'Print CLI configuration'
  static override args = {
    key: Args.string({ description: 'Optional config key to print', options: ['baseURL', 'auth', 'defaultTarget', 'defaultAccount'], required: false }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConfigGet)
    const config = await readConfig()
    const safeConfig = {
      ...config,
      auth: config.auth ? { ...config.auth, accessToken: '[redacted]' } : config.auth,
    }
    const format = flags.json ? 'json' : 'human'
    if (args.key) {
      await printData(safeConfig[args.key as keyof typeof safeConfig], format)
      return
    }
    await printConfig(safeConfig as unknown as Record<string, unknown>, format)
  }
}
