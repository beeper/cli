import { Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { checkAccessToken, parseTimeoutMs } from '../../lib/auth-health.js'
import { resolveTarget } from '../../lib/targets.js'
import { printData } from '../../lib/output.js'

export default class AuthStatus extends BeeperCommand {
  static override summary = 'Show stored auth for the selected target'
  static override flags = {
    check: Flags.boolean({ default: false, description: 'Validate the selected bearer token against the live target' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthStatus)
    const target = await resolveTarget({ target: flags.target, baseURL: flags['base-url'] })
    const token = process.env.BEEPER_ACCESS_TOKEN || target.auth?.accessToken
    const authenticated = Boolean(token)
    const data = {
      authenticated,
      target: target.id,
      baseURL: target.baseURL,
      source: process.env.BEEPER_ACCESS_TOKEN ? 'env' : target.auth?.source ?? (target.auth?.accessToken ? 'target' : 'none'),
      clientID: target.auth?.clientID,
      expiresAt: target.auth?.expiresAt,
      scope: target.auth?.scope,
      ...(flags.check ? { check: await checkAccessToken(target.baseURL, token, { timeoutMs: parseTimeoutMs(flags.timeout) }) } : {}),
    }
    await printData(data, flags.json ? 'json' : 'human')
  }
}
