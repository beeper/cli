import { BeeperCommand } from '../../lib/command.js'
import { getAppState } from '../../lib/app-state.js'
import { printData } from '../../lib/output.js'
export default class VerifyList extends BeeperCommand {
  static override summary = 'List active verification work'
  async run(): Promise<void> {
    const { flags } = await this.parse(VerifyList)
    const state = await getAppState({ baseURL: flags['base-url'], target: flags.target })
    await printData(state.verification ? [state.verification] : [], flags.json ? 'json' : 'human')
  }
}
