import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { resetConfig } from '../../lib/targets.js'
import { printDryRun, printSuccess } from '../../lib/output.js'

export default class ConfigReset extends BeeperCommand {
  static override summary = 'Reset CLI configuration'

  async run(): Promise<void> {
    const { flags } = await this.parse(ConfigReset)
    ensureWritable(flags)
    const format = flags.json ? 'json' : 'human'
    if (flags['dry-run']) {
      await printDryRun('config.reset', {}, format)
      return
    }
    await resetConfig()
    await printSuccess({ message: 'Config reset' }, format)
  }
}
