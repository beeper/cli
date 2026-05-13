import BeeperDesktop from '@beeper/desktop-api'
import { getAccessToken, readConfig } from './config.js'

export async function createClient(flags: { baseURL?: string; 'base-url'?: string; debug?: boolean } = {}) {
  const config = await readConfig()
  const accessToken = await requireToken()
  return new BeeperDesktop({
    accessToken,
    baseURL: flags.baseURL || flags['base-url'] || config.baseURL,
    logLevel: flags.debug ? 'debug' : 'warn',
  })
}

export async function requireToken(): Promise<string> {
  const token = await getAccessToken()
  if (!token) {
    throw new Error('Not authenticated. Run `beeper auth login` or set BEEPER_ACCESS_TOKEN.')
  }
  return token
}
