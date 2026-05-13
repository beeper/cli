import { Command, Flags } from '@oclif/core'
import { loginWithPKCE } from '../../lib/oauth.js'
import { readConfig } from '../../lib/config.js'

export default class AuthLogin extends Command {
  static override summary = 'Authenticate with Beeper Desktop using OAuth2 PKCE'
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    'client-name': Flags.string({ default: 'Beeper CLI', description: 'OAuth client name shown in Beeper Desktop' }),
    'no-open': Flags.boolean({ default: false, description: 'Print the authorization URL instead of opening a browser' }),
    scope: Flags.string({ default: 'read write', description: 'Space-separated OAuth scopes' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthLogin)
    const config = await readConfig()
    const token = await loginWithPKCE({
      baseURL: flags['base-url'] ?? config.baseURL,
      clientName: flags['client-name'],
      openBrowser: !flags['no-open'],
      scope: flags.scope,
    })
    this.log(`Authenticated as OAuth client ${token.clientID}`)
    if (token.expires_in) this.log(`Token expires in ${token.expires_in}s`)
  }
}
