import { Command, Flags } from '@oclif/core'
import { commandManifest } from '../lib/manifest.js'
import { printData } from '../lib/output.js'

export default class Commands extends Command {
  static override summary = 'Print the Beeper CLI command manifest'
  static override flags = {
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Commands)
    printData(commandManifest, flags.json ? 'json' : 'human')
  }
}
