import BeeperDesktop from '@beeper/desktop-api'
import { getAccessToken, readConfig } from './config.js'
import { ensureDesktopToken } from './desktop-auth.js'

export async function createClient(flags: { baseURL?: string; 'base-url'?: string; debug?: boolean } = {}) {
  const explicitBaseURL = flags.baseURL || flags['base-url']
  const accessToken = await requireToken({ baseURL: explicitBaseURL, scan: !explicitBaseURL })
  const config = await readConfig()
  return new BeeperDesktop({
    accessToken,
    baseURL: explicitBaseURL || config.baseURL,
    logLevel: flags.debug ? 'debug' : 'warn',
  })
}

export async function requireToken(options: { baseURL?: string; scan?: boolean } = {}): Promise<string> {
  const token = await getAccessToken()
  if (token) return token
  return ensureDesktopToken({ baseURL: options.baseURL, scan: options.scan })
}
