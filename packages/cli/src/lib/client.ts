import { BeeperDesktop } from '@beeper/desktop-api'
import { resolveTarget } from './targets.js'
import { ensureDesktopToken } from './desktop-auth.js'

export async function createClient(flags: { baseURL?: string; 'base-url'?: string; target?: string; debug?: boolean } = {}) {
  const target = await resolveTarget({ target: flags.target, baseURL: flags.baseURL || flags['base-url'] })
  const accessToken = process.env.BEEPER_ACCESS_TOKEN
    || target.auth?.accessToken
    || await ensureDesktopToken({ baseURL: target.baseURL, scan: target.id === 'desktop' })
  return new BeeperDesktop({
    accessToken,
    baseURL: target.baseURL,
    logLevel: flags.debug ? 'debug' : 'warn',
  })
}

export async function requireToken(options: { baseURL?: string; target?: string; scan?: boolean } = {}): Promise<string> {
  const target = await resolveTarget({ target: options.target, baseURL: options.baseURL })
  const token = process.env.BEEPER_ACCESS_TOKEN || target.auth?.accessToken
  if (token) return token
  return ensureDesktopToken({ baseURL: target.baseURL, scan: options.scan })
}
