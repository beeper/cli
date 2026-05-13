import { Command } from '@oclif/core'
import { resetConfig } from '../../lib/config.js'

export default class ConfigReset extends Command {
  static override summary = 'Reset CLI configuration'

  async run(): Promise<void> {
    await resetConfig()
    this.log('Config reset')
  }
}
