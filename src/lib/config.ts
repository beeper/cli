import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

export type StoredAuth = {
  accessToken: string
  clientID?: string
  expiresAt?: string
  scope?: string
  tokenType: 'Bearer'
}

export type Config = {
  auth?: StoredAuth
  baseURL: string
}

const defaultBaseURL = 'http://127.0.0.1:23373'

export const configPath = () =>
  join(process.env.BEEPER_CLI_CONFIG_DIR ?? join(homedir(), '.config', 'beeper'), 'config.json')

export async function readConfig(): Promise<Config> {
  const baseURL = process.env.BEEPER_DESKTOP_BASE_URL || process.env.BEEPER_BASE_URL
  try {
    const raw = await readFile(configPath(), 'utf8')
    const parsed = JSON.parse(raw) as Partial<Config>
    return {
      baseURL: baseURL || parsed.baseURL || defaultBaseURL,
      auth: parsed.auth,
    }
  } catch {
    return { baseURL: baseURL || defaultBaseURL }
  }
}

export async function writeConfig(config: Config): Promise<void> {
  const file = configPath()
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 })
}

export async function updateConfig(update: (config: Config) => Config | Promise<Config>): Promise<Config> {
  const next = await update(await readConfig())
  await writeConfig(next)
  return next
}

export async function resetConfig(): Promise<void> {
  await rm(configPath(), { force: true })
}

export async function getAccessToken(): Promise<string | undefined> {
  return process.env.BEEPER_ACCESS_TOKEN || (await readConfig()).auth?.accessToken
}

export async function getBaseURL(override?: string): Promise<string> {
  return override || (await readConfig()).baseURL
}
