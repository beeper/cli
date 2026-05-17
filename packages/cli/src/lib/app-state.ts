import { appRequest, promptYesNo } from './app-api.js'

export type AppState = {
  state: string
  matrix?: { userID?: string; deviceID?: string; homeserver?: string }
  verification?: {
    state: string
    availableActions?: string[]
    verificationID?: string
    sas?: { emojis?: string; decimals?: string }
    error?: { code?: string; reason?: string }
  }
}

export function nextAppStep(state: AppState, targetID?: string): string | undefined {
  const target = targetID && targetID !== 'desktop' ? ` -t ${targetID}` : ''
  if (state.state === 'ready') return undefined
  if (state.state === 'needs-login') return `Run: beeper login${target}`
  if (state.state === 'needs-verification') return `Run: beeper verify${target}`
  if (state.state === 'needs-secrets') return `Run: beeper app e2ee recovery-code verify${target}`
  if (state.state === 'needs-cross-signing-setup') return `Run: beeper app e2ee recovery-code reset begin${target}`
  return `Waiting for app state: ${state.state}`
}

export async function getAppState(options: { baseURL?: string; target?: string; token?: string | false } = {}): Promise<AppState> {
  return appRequest<AppState>('GET', '/v1/app/setup', options)
}

export async function driveVerification(options: { baseURL?: string; target?: string; userID?: string; yes?: boolean } = {}): Promise<AppState> {
  let state = await getAppState(options)
  if (state.state === 'ready') return state
  if (state.state === 'needs-login') throw new Error('Target is not signed in. Run `beeper login` first.')

  for (;;) {
    const verification = state.verification
    const actions = new Set(verification?.availableActions ?? [])
    const id = verification?.verificationID

    if (!verification) {
      state = (await appRequest<{ session: AppState }>('POST', '/v1/app/setup/verifications', {
        ...options,
        body: options.userID ? { userID: options.userID } : {},
      })).session
      continue
    }

    if (actions.has('accept') && id) {
      state = (await appRequest<{ session: AppState }>('POST', `/v1/app/setup/verifications/${encodeURIComponent(id)}/accept`, options)).session
      continue
    }

    if (actions.has('sas.start') && id) {
      state = (await appRequest<{ session: AppState }>('POST', `/v1/app/setup/verifications/${encodeURIComponent(id)}/sas/start`, options)).session
      continue
    }

    if (actions.has('sas.confirm') && id) {
      const sas = state.verification?.sas
      if (!options.yes) {
        process.stdout.write(`Verify that this matches on the other device:\n${sas?.emojis ?? sas?.decimals ?? '(no SAS data)'}\n`)
        if (!await promptYesNo('Do they match?')) throw new Error('Verification cancelled.')
      }
      state = (await appRequest<{ session: AppState }>('POST', `/v1/app/setup/verifications/${encodeURIComponent(id)}/sas/confirm`, options)).session
      continue
    }

    if (actions.has('qr.confirmScanned') && id) {
      state = (await appRequest<{ session: AppState }>('POST', `/v1/app/setup/verifications/${encodeURIComponent(id)}/qr/confirm-scanned`, options)).session
      continue
    }

    return state
  }
}
