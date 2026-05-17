import { readConfig } from './targets.js'
import { loginWithPKCE } from './oauth.js'

export type DesktopAppStatus = {
  state?: string
}

type DesktopProbe = {
  baseURL: string
  status?: DesktopAppStatus
}

const defaultPort = 23_373
const scanPorts = Array.from({ length: 20 }, (_, index) => defaultPort + index)

export async function findLocalDesktop(options: { baseURL?: string; scan?: boolean; timeoutMs?: number } = {}): Promise<DesktopProbe> {
  const config = await readConfig()
  const preferred = options.baseURL ?? config.baseURL ?? 'http://127.0.0.1:23373'
  const candidates = candidateBaseURLs(preferred, options.scan ?? true)
  const timeoutMs = options.timeoutMs ?? 500

  const preferredProbe = await probeDesktop(preferred, timeoutMs)
  if (preferredProbe) return preferredProbe

  const rest = candidates.filter(url => url !== preferred)
  if (rest.length) {
    try {
      return await Promise.any(rest.map(async url => {
        const probe = await probeDesktop(url, timeoutMs)
        if (!probe) throw new Error('not found')
        return probe
      }))
    } catch { /* fall through */ }
  }

  throw new Error(`Could not find a running Beeper Desktop API on ${candidates.join(', ')}.`)
}

export async function ensureDesktopToken(options: {
  baseURL?: string
  clientName?: string
  openBrowser?: boolean
  scan?: boolean
  scope?: string
} = {}): Promise<string> {
  const desktop = await findLocalDesktop({ baseURL: options.baseURL, scan: options.scan })
  if (desktop.status?.state === 'needs-login') {
    throw new Error('Beeper Desktop is not signed in. Open Beeper Desktop and sign in, then rerun this command.')
  }

  const token = await loginWithPKCE({
    baseURL: desktop.baseURL,
    clientName: options.clientName ?? 'Beeper CLI',
    openBrowser: options.openBrowser ?? true,
    save: true,
    scope: options.scope ?? 'read write',
  })
  return token.access_token
}

export async function getDesktopAppStatus(baseURL: string): Promise<DesktopAppStatus | undefined> {
  const response = await fetchWithTimeout(new URL('/v1/app/setup', baseURL), {}, 2_000)
  if (response.status === 401 || response.status === 403 || response.status === 404) return undefined
  if (!response.ok) throw new Error(`GET /v1/app/setup failed: ${response.status} ${await response.text()}`)
  return response.json() as Promise<DesktopAppStatus>
}

function candidateBaseURLs(preferred: string, scan: boolean): string[] {
  const urls = new Set<string>([preferred])
  if (!scan) return [...urls]
  for (const port of scanPorts) {
    urls.add(`http://127.0.0.1:${port}`)
    urls.add(`http://localhost:${port}`)
  }
  return [...urls]
}

async function probeDesktop(baseURL: string, timeoutMs: number): Promise<DesktopProbe | undefined> {
  try {
    const info = await fetchWithTimeout(new URL('/v1/info', baseURL), {}, timeoutMs)
    if (!info.ok) return undefined
    return { baseURL, status: await getDesktopAppStatus(baseURL) }
  } catch {
    return undefined
  }
}

async function fetchWithTimeout(url: URL, init: RequestInit = {}, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}
