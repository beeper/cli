import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { getAccessToken, resolveTarget, updateTargetCache } from './targets.js'
import type { ResetCreateResponse } from '@beeper/desktop-api/resources/app/setup/recovery-key/reset.js'
import type {
  SetupRegisterResponse,
  SetupResponseResponse,
  SetupRetrieveResponse,
} from '@beeper/desktop-api/resources/app/setup/setup.js'

export type AppStateSnapshot = SetupRetrieveResponse
export type AppLoginSuccess = SetupRegisterResponse
export type AppRegistrationRequired = Extract<SetupResponseResponse, { registrationRequired: true }>
export type AppLoginOutput = SetupResponseResponse

export type AppMutationResponse = {
  appState: AppStateSnapshot
}

export type AppRecoveryCodeResetBeginResponse = ResetCreateResponse

export async function appRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  options: { baseURL?: string; body?: Record<string, unknown>; token?: string | false; target?: string } = {},
): Promise<T> {
  const target = await resolveTarget({ target: options.target, baseURL: options.baseURL })
  const baseURL = target.baseURL
  const token = options.token === false ? undefined : options.token ?? await getAccessToken(target)
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  if (options.body) headers['content-type'] = 'application/json'

  const response = await fetch(new URL(path, baseURL), {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!response.ok) throw new Error(`${method} ${path} failed: ${response.status} ${await response.text()}`)
  if (response.status === 204) return undefined as T
  const text = await response.text()
  const data = (text ? JSON.parse(text) : {}) as T
  if (method === 'GET' && path === '/v1/app/setup') {
    await updateTargetCache(target, { baseURL, appState: data }).catch(() => undefined)
  }
  return data
}

export async function promptText(label: string): Promise<string> {
  const rl = createInterface({ input, output })
  try {
    const value = await rl.question(label)
    return value.trim()
  } finally {
    rl.close()
  }
}

export async function promptYesNo(label: string): Promise<boolean> {
  const value = (await promptText(`${label} [y/N] `)).toLowerCase()
  return value === 'y' || value === 'yes'
}

export function isRegistrationRequired(output: AppLoginOutput): output is AppRegistrationRequired {
  return 'registrationRequired' in output && output.registrationRequired === true
}
