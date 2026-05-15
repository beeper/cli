import BeeperDesktop from '@beeper/desktop-api'
import { readConfig } from './config.js'
import { ensureDesktopToken } from './desktop-auth.js'

export async function createClient(flags: { baseURL?: string; 'base-url'?: string; debug?: boolean } = {}) {
  const explicitBaseURL = flags.baseURL || flags['base-url']
  const config = await readConfig()
  const accessToken = process.env.BEEPER_ACCESS_TOKEN
    || config.auth?.accessToken
    || await ensureDesktopToken({ baseURL: explicitBaseURL, scan: !explicitBaseURL })
  return new BeeperDesktop({
    accessToken,
    baseURL: explicitBaseURL || config.baseURL,
    logLevel: flags.debug ? 'debug' : 'warn',
  })
}

export async function requireToken(options: { baseURL?: string; scan?: boolean } = {}): Promise<string> {
  const config = await readConfig()
  const token = process.env.BEEPER_ACCESS_TOKEN || config.auth?.accessToken
  if (token) return token
  return ensureDesktopToken({ baseURL: options.baseURL, scan: options.scan })
}
