import { BeeperCommand } from '../../lib/command.js'
import { getAppState } from '../../lib/app-state.js'
import { printData } from '../../lib/output.js'
export default class VerifyShow extends BeeperCommand {
  static override summary = 'Show active verification details'
  async run(): Promise<void> {
    const { flags } = await this.parse(VerifyShow)
    await printData((await getAppState({ baseURL: flags['base-url'], target: flags.target })).verification ?? null, flags.json ? 'json' : 'human')
  }
}
