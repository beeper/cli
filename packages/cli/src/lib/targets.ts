import { constants as fsConstants } from 'node:fs'
import { access, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export type StoredAuth = {
  accessToken: string
  clientID?: string
  expiresAt?: string
  scope?: string
  tokenType: 'Bearer'
}

export type Target = {
  id: string
  type: 'desktop' | 'server' | 'remote'
  name?: string
  baseURL: string
  auth?: StoredAuth
  managed?: boolean
  dataDir?: string
  profile?: string
  runtime?: {
    install?: 'desktop' | 'server'
    dataDir?: string
    port?: number
  }
  serverEnv?: string
  port?: number
}

export type ManagedTargetType = 'desktop' | 'server'

export type Config = {
  defaultTarget?: string
  baseURL?: string
  auth?: StoredAuth
}

const defaultPort = 23_373
const defaultBaseURL = `http://127.0.0.1:${defaultPort}`

export function beeperDir(): string {
  return process.env.BEEPER_CLI_CONFIG_DIR ?? join(homedir(), '.beeper')
}

export const configPath = () => join(beeperDir(), 'config.json')
export const cachePath = () => join(beeperDir(), 'cache.json')
export const targetsDir = () => join(beeperDir(), 'targets')
export const pluginsDir = () => join(beeperDir(), 'plugins')
export const profileDataDir = (type: ManagedTargetType, id: string) => join(beeperDir(), 'profiles', type, id)

export async function ensureBeeperDirs(): Promise<void> {
  await Promise.all([
    mkdir(targetsDir(), { recursive: true }),
    mkdir(pluginsDir(), { recursive: true }),
    mkdir(join(beeperDir(), 'profiles'), { recursive: true }),
  ])
}

export async function readConfig(): Promise<Config> {
  try {
    return JSON.parse(await readFile(configPath(), 'utf8')) as Config
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw error
  }
}

export async function writeConfig(config: Config): Promise<void> {
  await mkdir(dirname(configPath()), { recursive: true })
  await writeFile(configPath(), `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 })
}

export async function updateConfig(update: (config: Config) => Config | Promise<Config>): Promise<Config> {
  const next = await update(await readConfig())
  await writeConfig(next)
  return next
}

export async function resetConfig(): Promise<void> {
  await rm(configPath(), { force: true })
}

export async function updateTargetCache(target: Target, data: Record<string, unknown>): Promise<void> {
  let cache: { targets?: Record<string, unknown> } = {}
  try {
    cache = JSON.parse(await readFile(cachePath(), 'utf8'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  await mkdir(dirname(cachePath()), { recursive: true })
  await writeFile(cachePath(), `${JSON.stringify({
    ...cache,
    targets: {
      ...cache.targets,
      [target.id]: { ...data, updatedAt: new Date().toISOString() },
    },
  }, null, 2)}\n`, { mode: 0o600 })
}

export async function listTargets(): Promise<Target[]> {
  await ensureBeeperDirs()
  const files = await readdir(targetsDir()).catch(() => [])
  const targets = await Promise.all(files.filter(file => file.endsWith('.json')).map(async file => {
    try {
      return JSON.parse(await readFile(join(targetsDir(), file), 'utf8')) as Target
    } catch {
      return undefined
    }
  }))
  return targets.filter((target): target is Target => !!target).sort((a, b) => a.id.localeCompare(b.id))
}

export async function readTarget(id: string): Promise<Target | undefined> {
  try {
    return JSON.parse(await readFile(targetPath(id), 'utf8')) as Target
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

export async function writeTarget(target: Target): Promise<void> {
  await ensureBeeperDirs()
  await writeFile(targetPath(target.id), `${JSON.stringify(target, null, 2)}\n`, { mode: 0o600 })
}

export async function removeTarget(id: string): Promise<void> {
  await rm(targetPath(id), { force: true })
  await updateConfig(config => config.defaultTarget === id ? {} : config)
}

export async function saveTargetAuth(target: Target, auth: StoredAuth): Promise<void> {
  if (target.id === 'custom' || target.id === 'desktop') {
    await updateConfig(config => ({ ...config, baseURL: target.baseURL, auth }))
    return
  }
  await writeTarget({ ...target, auth })
}

export async function clearTargetAuth(target: Target): Promise<void> {
  if (target.id === 'custom' || target.id === 'desktop') {
    await updateConfig(config => ({ ...config, auth: undefined }))
    return
  }
  await writeTarget({ ...target, auth: undefined })
}

export async function resolveTarget(options: { target?: string; baseURL?: string } = {}): Promise<Target> {
  if (options.baseURL) return { id: 'custom', type: 'desktop', baseURL: options.baseURL }
  const envTarget = process.env.BEEPER_TARGET
  const config = await readConfig()
  const targetID = options.target ?? envTarget ?? config.defaultTarget
  if (targetID) {
    const target = await readTarget(targetID)
    if (!target) throw new Error(`Unknown Beeper target "${targetID}". Run \`beeper targets list\`.`)
    return target
  }
  const targets = await listTargets()
  if (targets.length === 1 && targets[0]) return targets[0]
  return { id: 'desktop', type: 'desktop', name: 'Desktop', baseURL: process.env.BEEPER_DESKTOP_BASE_URL || process.env.BEEPER_BASE_URL || config.baseURL || defaultBaseURL, auth: config.auth }
}

export async function createProfileTarget(type: ManagedTargetType, id: string, options: { serverEnv?: string; port?: number } = {}): Promise<Target> {
  const serverEnv = options.serverEnv ?? 'production'
  const port = options.port ?? await nextPort()
  const target: Target = {
    id,
    type,
    name: id,
    baseURL: `http://127.0.0.1:${port}`,
    managed: true,
    dataDir: profileDataDir(type, id),
    profile: id,
    runtime: {
      install: type,
      dataDir: profileDataDir(type, id),
      port,
    },
    serverEnv,
    port,
  }
  await mkdir(target.dataDir!, { recursive: true })
  await writeTarget(target)
  return target
}

export async function getAccessToken(target?: Target): Promise<string | undefined> {
  return process.env.BEEPER_ACCESS_TOKEN || target?.auth?.accessToken || (await resolveTarget()).auth?.accessToken
}

export async function getBaseURL(override?: string): Promise<string> {
  return (await resolveTarget({ baseURL: override })).baseURL
}

function targetPath(id: string): string {
  return join(targetsDir(), `${id}.json`)
}

async function nextPort(): Promise<number> {
  const used = new Set((await listTargets()).map(target => target.port).filter((port): port is number => typeof port === 'number'))
  for (let port = defaultPort + 1; port < defaultPort + 200; port++) {
    if (!used.has(port)) return port
  }
  throw new Error('No available default port for a new Beeper target.')
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}
