import { BeeperCommand } from '../lib/command.js'
import { printData } from '../lib/output.js'
export default class Docs extends BeeperCommand {
  static override summary = 'Open Beeper CLI docs'
  async run(): Promise<void> {
    const { flags } = await this.parse(Docs)
    await printData({ url: 'https://developers.beeper.com/desktop-api-reference' }, flags.json ? 'json' : 'human')
  }
}
