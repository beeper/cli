import { Command } from '@oclif/core'
import { readConfig, updateConfig } from '../../lib/config.js'

export default class AuthLogout extends Command {
  static override summary = 'Remove the locally stored Beeper Desktop token'

  async run(): Promise<void> {
    const config = await readConfig()
    const token = config.auth?.accessToken
    if (token) {
      await fetch(new URL('/oauth/revoke', config.baseURL), {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token, token_type_hint: 'access_token' }),
      }).catch(() => undefined)
    }
    await updateConfig(current => ({ ...current, auth: undefined }))
    this.log('Logged out')
  }
}
