import { BeeperCommand } from '../../lib/command.js'
import { appRequest } from '../../lib/app-api.js'
import type { AppState } from '../../lib/app-state.js'
import { printData } from '../../lib/output.js'

export default class AppStatus extends BeeperCommand {
  static override summary = 'Show Beeper app login and encrypted messaging state'

  async run(): Promise<void> {
    const { flags } = await this.parse(AppStatus)
    const state = await appRequest<AppState>('GET', '/v1/app/setup', { baseURL: flags['base-url'], target: flags.target })
    await printData(state, flags.json ? 'json' : 'human')
  }
}
