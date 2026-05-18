import { Command } from '@oclif/core'

export default class Autocomplete extends Command {
  static override hidden = true

  async run(): Promise<void> {
    const autocompletePlugin = this.config.plugins.get('@oclif/plugin-autocomplete') as any
    const command = await autocompletePlugin?.findCommand?.('autocomplete', { must: true })
    if (!command?.run) throw new Error('Autocomplete plugin is not available. Run `beeper completion` for setup help.')
    await command.run(this.argv, this.config)
  }
}
