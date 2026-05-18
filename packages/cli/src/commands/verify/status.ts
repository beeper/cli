import { BeeperCommand } from '../../lib/command.js'
import { evaluateReadiness } from '../../lib/app-state.js'
import { printData } from '../../lib/output.js'
export default class AuthVerifyStatus extends BeeperCommand {
  static override summary = 'Show encryption and device-verification readiness'
  async run(): Promise<void> {
    const { flags } = await this.parse(AuthVerifyStatus)
    await printData(await evaluateReadiness({ baseURL: flags['base-url'], target: flags.target }), flags.json ? 'json' : 'human')
  }
}
