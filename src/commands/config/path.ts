import { Command } from '@oclif/core'
import { configPath } from '../../lib/config.js'

export default class ConfigPath extends Command {
  static override summary = 'Print the CLI config path'

  async run(): Promise<void> {
    this.log(configPath())
  }
}
