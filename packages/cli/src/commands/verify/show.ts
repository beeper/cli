import { BeeperCommand } from '../../lib/command.js'
import { getAppState } from '../../lib/app-state.js'
import { printData } from '../../lib/output.js'
export default class AuthVerifyShow extends BeeperCommand {
  static override summary = 'Show the current active verification request'
  async run(): Promise<void> {
    const { flags } = await this.parse(AuthVerifyShow)
    await printData((await getAppState({ baseURL: flags['base-url'], target: flags.target })).verification ?? null, flags.json ? 'json' : 'human')
  }
}
