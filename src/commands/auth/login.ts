import { Command, Flags } from '@oclif/core'
import { loginWithPKCE } from '../../lib/oauth.js'
import { readConfig, updateConfig } from '../../lib/config.js'
import { findLocalDesktop, getDesktopAppStatus } from '../../lib/desktop-auth.js'
import {
  type AppLoginOutput,
  type AppLoginSuccess,
  appRequest,
  isRegistrationRequired,
  promptText,
  promptYesNo,
} from '../../lib/app-api.js'
import { printData } from '../../lib/output.js'

export default class AuthLogin extends Command {
  static override summary = 'Authenticate with local Beeper Desktop'
  static override flags = {
    'server-url': Flags.string({
      aliases: ['base-url'],
      description: 'Beeper Desktop API server URL',
    }),
    email: Flags.string({ description: 'Email address to send a sign-in code to' }),
    code: Flags.string({ description: 'Email sign-in code' }),
    username: Flags.string({ description: 'Username to create if registration is required' }),
    'accept-terms': Flags.boolean({ default: false, description: 'Accept the Terms of Use and acknowledge the Privacy Policy when creating an account' }),
    'app-login': Flags.boolean({ default: false, description: 'Sign in the local Beeper Desktop app itself instead of requesting a Desktop API token from an already signed-in app' }),
    'no-save': Flags.boolean({ default: false, description: 'Do not store the returned Desktop API token' }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
    oauth: Flags.boolean({ default: false, description: 'Use the OAuth2 PKCE Desktop API authorization flow' }),
    'client-name': Flags.string({ default: 'Beeper CLI', description: 'OAuth client name shown in Beeper Desktop' }),
    'no-open': Flags.boolean({ default: false, description: 'Print the authorization URL instead of opening a browser' }),
    scope: Flags.string({ default: 'read write', description: 'Space-separated OAuth scopes' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthLogin)
    const config = await readConfig()
    const desktop = await findLocalDesktop({
      baseURL: flags['server-url'] ?? config.baseURL,
      scan: !flags['server-url'],
    })
    const baseURL = desktop.baseURL

    const useAppLogin = flags['app-login']
      || Boolean(flags.email || flags.code || flags.username || flags['accept-terms'])

    if (!useAppLogin && !flags.oauth && await this.shouldUseAppLogin(baseURL)) {
      throw new Error('Beeper Desktop is not signed in. Open Beeper Desktop and sign in, then rerun this command, or pass --app-login to sign in the app itself.')
    }

    if (!useAppLogin || flags.oauth) {
      const token = await loginWithPKCE({
        baseURL,
        clientName: flags['client-name'],
        openBrowser: !flags['no-open'],
        save: !flags['no-save'],
        scope: flags.scope,
      })
      if (flags.json) {
        printData(token, 'json')
        return
      }
      this.log(`Authenticated as OAuth client ${token.clientID}`)
      if (token.expires_in) this.log(`Token expires in ${token.expires_in}s`)
      if (flags['no-save']) this.log('Token was not saved')
      return
    }

    const start = await appRequest<{ request: string; type: string[] }>('POST', '/v1/app/login/start', {
      baseURL,
      token: false,
    })
    const email = flags.email ?? await promptText('Email: ')
    await appRequest<Record<string, never>>('POST', '/v1/app/login/email', {
      baseURL,
      token: false,
      body: { request: start.request, email },
    })
    const code = flags.code ?? await promptText('Code: ')
    let result = await appRequest<AppLoginOutput>('POST', '/v1/app/login/response', {
      baseURL,
      token: false,
      body: { request: start.request, response: code },
    })

    if (isRegistrationRequired(result)) {
      result = await this.register(baseURL, result, flags)
    }

    await this.finishLogin(baseURL, result, { json: flags.json, save: !flags['no-save'] })
  }

  private async shouldUseAppLogin(baseURL: string): Promise<boolean> {
    const status = await getDesktopAppStatus(baseURL)
    return status?.state === 'needs-login'
  }

  private async register(
    baseURL: string,
    required: Extract<AppLoginOutput, { registrationRequired: true }>,
    flags: { username?: string; 'accept-terms': boolean; json?: boolean },
  ): Promise<AppLoginSuccess> {
    if (!flags.json && required.copy?.title) this.log(required.copy.title)
    if (!flags.json && required.usernameSuggestions?.length) this.log(`Suggestions: ${required.usernameSuggestions.join(', ')}`)
    const username = flags.username ?? await promptText(`${required.copy?.usernamePlaceholder ?? 'Username'}: `)
    const accepted = flags['accept-terms'] || await promptYesNo(required.copy?.terms ?? 'Accept Terms of Use and acknowledge Privacy Policy?')
    if (!accepted) throw new Error('Account creation requires --accept-terms or an interactive yes response.')
    return appRequest<AppLoginSuccess>('POST', '/v1/app/login/register', {
      baseURL,
      token: false,
      body: {
        request: required.request,
        leadToken: required.leadToken,
        username,
        acceptTerms: true,
      },
    })
  }

  private async finishLogin(
    baseURL: string,
    result: AppLoginSuccess,
    options: { json: boolean; save: boolean },
  ): Promise<void> {
    if (options.save) {
      await updateConfig(config => ({
        ...config,
        baseURL,
        auth: {
          accessToken: result.desktopAPI.accessToken,
          scope: result.desktopAPI.scope,
          tokenType: result.desktopAPI.tokenType,
        },
      }))
    }

    if (options.json) {
      printData(result, 'json')
      return
    }

    const user = result.matrix.userID
    this.log(`Authenticated as ${user}`)
    this.log(`App state: ${result.appState.state}`)
    if (!options.save) this.log('Token was not saved')
  }
}
