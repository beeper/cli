import { BeeperCommand } from '../../lib/command.js'
import { evaluateReadiness } from '../../lib/app-state.js'
import { printData } from '../../lib/output.js'
export default class VerifyStatus extends BeeperCommand {
  static override summary = 'Show encryption readiness'
  async run(): Promise<void> {
    const { flags } = await this.parse(VerifyStatus)
    await printData(await evaluateReadiness({ baseURL: flags['base-url'], target: flags.target }), flags.json ? 'json' : 'human')
  }
}
