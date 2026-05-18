import { BeeperCommand } from '../../lib/command.js'
import { resolveTarget } from '../../lib/targets.js'
import { printData } from '../../lib/output.js'

export default class AuthStatus extends BeeperCommand {
  static override summary = 'Show stored auth for the selected target'

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthStatus)
    const target = await resolveTarget({ target: flags.target, baseURL: flags['base-url'] })
    const authenticated = Boolean(process.env.BEEPER_ACCESS_TOKEN || target.auth?.accessToken)
    const data = {
      authenticated,
      target: target.id,
      baseURL: target.baseURL,
      source: process.env.BEEPER_ACCESS_TOKEN ? 'env' : target.auth?.source ?? (target.auth?.accessToken ? 'target' : 'none'),
      clientID: target.auth?.clientID,
      expiresAt: target.auth?.expiresAt,
      scope: target.auth?.scope,
    }
    await printData(data, flags.json ? 'json' : 'human')
  }
}
