import { BeeperCommand } from '../lib/command.js'
import { metadataForCommand } from '../lib/command-metadata.js'
import { commandManifest } from '../lib/manifest.js'
import { printCommands } from '../lib/output.js'
export default class Man extends BeeperCommand {
  static override summary = 'Print the command manual'
  async run(): Promise<void> {
    const { flags } = await this.parse(Man)
    const commandsByID = new Map(this.config.commands.map(command => [command.id.replaceAll(':', ' '), command]))
    const commands = commandManifest.map(item => {
      const command = commandsByID.get(item.command)
      return {
        ...item,
        description: command?.summary || command?.description || item.description,
        ...metadataForCommand(item.command),
      }
    })
    await printCommands(commands, flags.json ? 'json' : 'human', { title: 'Beeper CLI' })
  }
}
