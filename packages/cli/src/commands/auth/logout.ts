import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { clearTargetAuth, resolveTarget } from '../../lib/targets.js'
import { printSuccess } from '../../lib/output.js'

export default class AuthLogout extends BeeperCommand {
  static override summary = 'Clear stored authentication'

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthLogout)
    ensureWritable(flags)
    const target = await resolveTarget({ target: flags.target, baseURL: flags['base-url'] })
    if (process.env.BEEPER_ACCESS_TOKEN && !target.auth?.accessToken) {
      throw new Error('auth logout cannot clear BEEPER_ACCESS_TOKEN from the environment; unset it in the calling process.')
    }
    const token = target.auth?.accessToken
    let revoked = false
    if (token) {
      const response = await fetch(new URL('/oauth/revoke', target.baseURL), {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token, token_type_hint: 'access_token' }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => undefined)
      revoked = Boolean(response?.ok)
      await clearTargetAuth(target)
    }
    await printSuccess({ message: 'Logged out', detail: token ? 'local token cleared' : 'no token was stored', data: { revoked, hadToken: Boolean(token) } }, flags.json ? 'json' : 'human')
  }
}
