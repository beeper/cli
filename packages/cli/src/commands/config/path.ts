import { BeeperCommand } from '../../lib/command.js'
import { configPath } from '../../lib/targets.js'

export default class ConfigPath extends BeeperCommand {
  static override summary = 'Print the CLI config path'

  async run(): Promise<void> {
    const { flags } = await this.parse(ConfigPath)
    const path = configPath()
    if (flags.json) {
      process.stdout.write(`${JSON.stringify({ path }, null, 2)}\n`)
      return
    }
    // Plain path so it's pipeable (xargs / cat / cd).
    process.stdout.write(`${path}\n`)
  }
}
