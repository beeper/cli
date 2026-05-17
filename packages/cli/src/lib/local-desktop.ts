import { execFile } from 'node:child_process'
import { access, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { BeeperDesktop } from '@beeper/desktop-api'
import type { StoredAuth, Target } from './targets.js'

const execFileAsync = promisify(execFile)

export type LocalDesktopSession = {
  auth: StoredAuth
  dataDir: string
  deviceID?: string
  homeserver?: string
  userID?: string
}

export async function findLocalDesktopSession(target?: Target): Promise<LocalDesktopSession> {
  const dirs = target?.dataDir ? [target.dataDir] : await localDesktopDataDirs()
  const errors: string[] = []
  for (const dataDir of dirs) {
    try {
      const state = await readBeeperState(dataDir)
      const accessToken = stringValue(state.access_token)
      if (!accessToken) throw new Error('missing access_token')
      return {
        auth: { accessToken, source: 'desktop-db', tokenType: 'Bearer' },
        dataDir,
        deviceID: stringValue(state.device_id),
        homeserver: stringValue(state.homeserver),
        userID: stringValue(state.user_id),
      }
    } catch (error) {
      errors.push(`${dataDir}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  throw new Error(`Could not find a signed-in local Beeper Desktop session. ${errors.join('; ')}`)
}

export async function connectedAccountSummary(target: Target, auth?: StoredAuth): Promise<string[]> {
  const token = auth?.accessToken ?? target.auth?.accessToken
  if (!token) return []
  const client = new BeeperDesktop({ baseURL: target.baseURL, accessToken: token })
  const response = await client.accounts.list()
  const rows = Array.isArray(response) ? response : ((response as { items?: unknown[] }).items ?? [])
  return rows
    .map(item => accountName(item))
    .filter((name): name is string => Boolean(name))
    .slice(0, 8)
}

async function localDesktopDataDirs(): Promise<string[]> {
  const candidates = new Set<string>()
  if (process.env.BEEPER_USER_DATA_DIR) return [process.env.BEEPER_USER_DATA_DIR]
  if (process.platform === 'darwin') {
    const appSupport = join(homedir(), 'Library', 'Application Support')
    candidates.add(join(appSupport, 'BeeperTexts'))
    for (const name of await readdir(appSupport).catch(() => [])) {
      if (name.startsWith('BeeperTexts-')) candidates.add(join(appSupport, name))
    }
  } else if (process.platform === 'win32') {
    const appData = process.env.APPDATA ?? homedir()
    candidates.add(join(appData, 'BeeperTexts'))
  } else {
    const configHome = process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config')
    candidates.add(join(configHome, 'BeeperTexts'))
  }
  return [...candidates]
}

async function readBeeperState(dataDir: string): Promise<Record<string, unknown>> {
  const dbPath = join(dataDir, 'index.db')
  await access(dbPath)
  const { stdout } = await execFileAsync('sqlite3', [
    '-json',
    dbPath,
    "SELECT value FROM key_values WHERE key = 'beeperState' LIMIT 1",
  ])
  const rows = JSON.parse(stdout || '[]') as Array<{ value?: string }>
  const value = rows[0]?.value
  if (!value) throw new Error('missing beeperState')
  const parsed = JSON.parse(value)
  if (!parsed || typeof parsed !== 'object') throw new Error('invalid beeperState')
  return parsed as Record<string, unknown>
}

function accountName(item: unknown): string | undefined {
  if (!item || typeof item !== 'object') return undefined
  const record = item as Record<string, unknown>
  const bridge = record.bridge && typeof record.bridge === 'object' ? record.bridge as Record<string, unknown> : undefined
  return stringValue(record.network)
    ?? stringValue(record.displayName)
    ?? stringValue(record.name)
    ?? stringValue(bridge?.type)
    ?? stringValue(record.accountID)
    ?? stringValue(record.id)
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}
