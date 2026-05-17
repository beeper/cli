import { Flags } from '@oclif/core'
import React from 'react'
import { Box, Text, render as inkRender } from 'ink'
import { BeeperCommand, ensureWritable } from '../lib/command.js'
import { loginWithPKCE } from '../lib/oauth.js'
import { readConfig, resolveTarget, saveTargetAuth } from '../lib/targets.js'
import { findLocalDesktop, getDesktopAppStatus } from '../lib/desktop-auth.js'
import {
  type AppLoginOutput,
  type AppLoginSuccess,
  appRequest,
  isRegistrationRequired,
  promptText,
  promptYesNo,
} from '../lib/app-api.js'
import { AuthSignedIn } from '../lib/ink/components.js'
import { theme, glyphs } from '../lib/ink/theme.js'
import { printData } from '../lib/output.js'
import { nextAppStep } from '../lib/app-state.js'

async function showSignedIn(props: React.ComponentProps<typeof AuthSignedIn>): Promise<void> {
  const instance = inkRender(<AuthSignedIn {...props} />, { exitOnCtrlC: false, patchConsole: false })
  setTimeout(() => instance.unmount(), 0)
  await instance.waitUntilExit().catch(() => undefined)
}

async function showStep(label: string, detail?: string): Promise<void> {
  const node = (
    <Box>
      <Text color={theme.primary}>{glyphs.arrow}</Text>
      <Text> </Text>
      <Text color={theme.text}>{label}</Text>
      {detail ? <Text color={theme.muted}>  {detail}</Text> : null}
    </Box>
  )
  const instance = inkRender(node, { exitOnCtrlC: false, patchConsole: false })
  setTimeout(() => instance.unmount(), 0)
  await instance.waitUntilExit().catch(() => undefined)
}

export default class Login extends BeeperCommand {
  static override summary = 'Authenticate with local Beeper Desktop'
  static override flags = {
    'server-url': Flags.string({
      description: 'Beeper Desktop API server URL',
    }),
    email: Flags.string({ description: 'Email address to send a sign-in code to' }),
    code: Flags.string({ description: 'Email sign-in code' }),
    username: Flags.string({ description: 'Username to create if registration is required' }),
    'accept-terms': Flags.boolean({ default: false, description: 'Accept the Terms of Use and acknowledge the Privacy Policy when creating an account' }),
    'app-login': Flags.boolean({ default: false, description: 'Sign in the local Beeper Desktop app itself instead of requesting a Desktop API token from an already-signed-in app' }),
    'no-save': Flags.boolean({ default: false, description: 'Do not store the returned Desktop API token' }),
    oauth: Flags.boolean({ default: false, description: 'Use the OAuth2 PKCE Desktop API authorization flow' }),
    'client-name': Flags.string({ default: 'Beeper CLI', description: 'OAuth client name shown in Beeper Desktop' }),
    'no-open': Flags.boolean({ default: false, description: 'Print the authorization URL instead of opening a browser' }),
    scope: Flags.string({ default: 'read write', description: 'Space-separated OAuth scopes' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Login)
    ensureWritable(flags)
    const config = await readConfig()
    const baseURLFlag = flags['server-url'] ?? flags['base-url']
    const target = await resolveTarget({ target: flags.target, baseURL: baseURLFlag })
    const desktop = await findLocalDesktop({
      baseURL: target.baseURL ?? config.baseURL,
      scan: !baseURLFlag && target.id === 'desktop',
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
        save: false,
        scope: flags.scope,
      })
      if (!flags['no-save']) {
        await saveTargetAuth({ ...target, baseURL }, {
          accessToken: token.access_token,
          clientID: token.clientID,
          expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : undefined,
          scope: token.scope,
          tokenType: token.token_type,
        })
      }
      if (flags.json) {
        await printData(token, 'json')
        return
      }
      const detail = token.expires_in ? `token expires in ${token.expires_in}s` : undefined
      await showSignedIn({ as: token.clientID, detail, saved: !flags['no-save'] })
      return
    }

    if (!flags.json) await showStep('Starting email sign-in', baseURL)
    const start = await appRequest<{ setupRequestID: string; signInMethods: string[] }>('POST', '/v1/app/setup/start', {
      baseURL,
      token: false,
    })
    const email = flags.email ?? await promptText('Email: ')
    if (!flags.json) await showStep('Sending one-time code', email)
    await appRequest<Record<string, never>>('POST', '/v1/app/setup/email', {
      baseURL,
      token: false,
      body: { setupRequestID: start.setupRequestID, email },
    })
    const code = flags.code ?? await promptText('Code: ')
    if (!flags.json) await showStep('Verifying code')
    let result = await appRequest<AppLoginOutput>('POST', '/v1/app/setup/response', {
      baseURL,
      token: false,
      body: { setupRequestID: start.setupRequestID, response: code },
    })

    if (isRegistrationRequired(result)) result = await this.register(baseURL, result, flags)
    await this.finishLogin(target, baseURL, result, { json: flags.json, save: !flags['no-save'] })
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
    if (!flags.json && required.copy?.title) await showStep(required.copy.title)
    if (!flags.json && required.usernameSuggestions?.length) {
      await showStep('Suggestions', required.usernameSuggestions.join(', '))
    }
    const username = flags.username ?? await promptText(`${required.copy?.usernamePlaceholder ?? 'Username'}: `)
    const accepted = flags['accept-terms'] || await promptYesNo(required.copy?.terms ?? 'Accept Terms of Use and acknowledge Privacy Policy?')
    if (!accepted) throw new Error('Account creation requires --accept-terms or an interactive yes response.')
    return appRequest<AppLoginSuccess>('POST', '/v1/app/setup/register', {
      baseURL,
      token: false,
      body: {
        setupRequestID: required.setupRequestID,
        leadToken: required.leadToken,
        username,
        acceptTerms: true,
      },
    })
  }

  private async finishLogin(
    target: Awaited<ReturnType<typeof resolveTarget>>,
    baseURL: string,
    result: AppLoginSuccess,
    options: { json: boolean; save: boolean },
  ): Promise<void> {
    if (options.save) {
      await saveTargetAuth({ ...target, baseURL }, {
        accessToken: result.matrix.accessToken,
        scope: 'read write',
        tokenType: 'Bearer',
      })
    }

    if (options.json) {
      await printData(result, 'json')
      return
    }
    const next = nextAppStep(result.session, target.id)
    await showSignedIn({
      as: result.matrix.userID,
      detail: next ?? 'E2EE ready',
      saved: options.save,
    })
  }
}
