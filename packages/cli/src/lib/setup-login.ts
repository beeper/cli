import { BeeperDesktop } from '@beeper/desktop-api'
import { evaluateReadiness } from './app-state.js'
import { isRegistrationRequired, promptText, promptYesNoDefaultYes, type AppLoginSuccess } from './app-api.js'
import { connectedAccountSummary } from './local-desktop.js'
import { saveTargetAuth, writeTarget, type AuthSource, type Target } from './targets.js'

export type SetupLoginResult = {
  accounts: string[]
  authSource?: AuthSource
  readiness: Awaited<ReturnType<typeof evaluateReadiness>>
  target: Omit<Target, 'auth'> & { auth?: { source?: AuthSource; tokenType?: 'Bearer' } }
}

export async function startEmailSetup(target: Target, email: string): Promise<{ setupRequestID: string }> {
  const client = setupClient(target)
  const start = await client.app.login.start()
  await client.app.login.email({ setupRequestID: start.setupRequestID, email })
  return { setupRequestID: start.setupRequestID }
}

export async function finishEmailSetup(target: Target, options: {
  code: string
  email?: string
  json?: boolean
  setupRequestID: string
  username?: string
  yes?: boolean
}): Promise<SetupLoginResult> {
  const client = setupClient(target)
  let output = await client.app.login.response({ setupRequestID: options.setupRequestID, response: options.code })
  if (isRegistrationRequired(output)) {
    if ((options.json || !process.stdin.isTTY) && !options.yes) throw new Error('Registration requires --yes to accept the Beeper terms in non-interactive setup.')
    const username = options.username ?? (options.json || !process.stdin.isTTY ? undefined : await promptUsername(output.usernameSuggestions))
    if (!username) throw new Error('Registration requires --username.')
    if (!options.yes && !await promptYesNoDefaultYes('Accept the Beeper terms and create this account?')) throw new Error('Registration cancelled.')
    output = await client.app.login.register({
      acceptTerms: true,
      leadToken: output.leadToken,
      setupRequestID: output.setupRequestID,
      username,
    })
  }
  return persistSetupLogin(target, output as AppLoginSuccess)
}

export async function interactiveEmailSetup(target: Target, options: { email: string; json?: boolean; username?: string; yes?: boolean }): Promise<SetupLoginResult> {
  const start = await startEmailSetup(target, options.email)
  const code = await promptText('Email code: ')
  return finishEmailSetup(target, { ...options, code, setupRequestID: start.setupRequestID })
}

function setupClient(target: Target): BeeperDesktop {
  return new BeeperDesktop({ baseURL: target.baseURL, accessToken: 'not-needed-for-setup', logLevel: 'warn' })
}

async function persistSetupLogin(target: Target, data: AppLoginSuccess): Promise<SetupLoginResult> {
  const token = data.matrix?.accessToken
  if (!token) throw new Error('Setup did not return a Matrix access token.')
  const auth = { accessToken: token, source: 'manual' as AuthSource, tokenType: 'Bearer' as const }
  await writeTarget(target)
  await saveTargetAuth(target, auth)
  const [readiness, accounts] = await Promise.all([
    evaluateReadiness({ baseURL: target.baseURL, target: target.id, token }),
    connectedAccountSummary(target, auth).catch(() => []),
  ])
  return { accounts, authSource: auth.source, readiness, target: publicTarget({ ...target, auth }) }
}

function publicTarget(target: Target): Omit<Target, 'auth'> & { auth?: { source?: AuthSource; tokenType?: 'Bearer' } } {
  const { auth, ...rest } = target
  return { ...rest, auth: auth ? { source: auth.source, tokenType: auth.tokenType } : undefined }
}

async function promptUsername(suggestions: string[] | undefined): Promise<string> {
  const fallback = suggestions?.[0]
  const suffix = fallback ? ` [${fallback}]` : ''
  const value = await promptText(`Username${suffix}: `)
  return value || fallback || ''
}
