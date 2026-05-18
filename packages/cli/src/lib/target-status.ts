import type { Target } from './targets.js'
import { checkInstallationUpdate, readInstallations } from './installations.js'

export type TargetLiveStatus = {
  reachable: boolean
  version?: string
  bundleID?: string
  actualType?: 'desktop' | 'server'
  error?: string
  update?: {
    available: boolean
    latestVersion?: string
    action: string
  }
}

export async function targetLiveStatus(target: Pick<Target, 'type' | 'baseURL' | 'managed'>): Promise<TargetLiveStatus> {
  try {
    const response = await fetch(new URL('/v1/info', target.baseURL), { signal: AbortSignal.timeout(3000) })
    if (!response.ok) return { reachable: false, error: `${response.status} ${response.statusText}` }
    const info = await response.json() as {
      app?: { version?: string; bundle_id?: string }
      server?: { hostname?: string; remote_access?: boolean }
    }
    const version = info.app?.version
    const bundleID = info.app?.bundle_id
    const actualType = typeFromInfo(info, target)

    if (target.type !== 'remote' && actualType && actualType !== target.type) {
      return {
        reachable: false,
        version,
        bundleID,
        actualType,
        error: `Expected ${target.type} target but ${target.baseURL} is ${actualType}.`,
      }
    }

    const installations = await readInstallations()
    const installation = target.type === 'server' ? installations.server : installations.desktop
    const update = installation
      ? await checkInstallationUpdate({ ...installation, version: version ?? installation.version }).catch(() => undefined)
      : undefined
    return {
      reachable: true,
      version,
      bundleID,
      actualType,
      update: update ? {
        available: update.available,
        latestVersion: update.latestVersion,
        action: target.type === 'desktop' ? 'Update Beeper Desktop in the app.' : update.action,
      } : undefined,
    }
  } catch {
    return { reachable: false, error: `Could not reach ${target.baseURL}` }
  }
}

function typeFromInfo(
  info: { app?: { bundle_id?: string }; server?: { hostname?: string; remote_access?: boolean } },
  target: Pick<Target, 'type' | 'managed'>,
): 'desktop' | 'server' | undefined {
  if (target.type === 'server' && target.managed && info.server?.hostname === '127.0.0.1' && info.server.remote_access === false) return 'server'
  return typeFromBundleID(info.app?.bundle_id)
}

function typeFromBundleID(bundleID?: string): 'desktop' | 'server' | undefined {
  if (!bundleID) return undefined
  if (bundleID.includes('.server')) return 'server'
  if (bundleID.includes('.desktop')) return 'desktop'
  return undefined
}
