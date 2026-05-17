import { BeeperCommand } from '../lib/command.js'
import { commandManifest } from '../lib/manifest.js'
import { printCommands } from '../lib/output.js'
export default class Man extends BeeperCommand {
  static override summary = 'Print the command manual'
  async run(): Promise<void> {
    const { flags } = await this.parse(Man)
    await printCommands(commandManifest, flags.json ? 'json' : 'human', { title: 'Beeper CLI' })
  }
}
