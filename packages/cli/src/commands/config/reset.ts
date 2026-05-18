import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { resetConfig } from '../../lib/targets.js'
import { printSuccess } from '../../lib/output.js'

export default class ConfigReset extends BeeperCommand {
  static override summary = 'Reset CLI configuration'

  async run(): Promise<void> {
    const { flags } = await this.parse(ConfigReset)
    ensureWritable(flags)
    await resetConfig()
    await printSuccess({ message: 'Config reset' }, flags.json ? 'json' : 'human')
  }
}
