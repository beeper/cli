import type { Target } from './targets.js'
import { checkInstallationUpdate, readInstallations } from './installations.js'

export type TargetLiveStatus = {
  reachable: boolean
  version?: string
  bundleID?: string
  error?: string
  update?: {
    available: boolean
    latestVersion?: string
    action: string
  }
}

export async function targetLiveStatus(target: Pick<Target, 'type' | 'baseURL'>): Promise<TargetLiveStatus> {
  try {
    const response = await fetch(new URL('/v1/info', target.baseURL), { signal: AbortSignal.timeout(3000) })
    if (!response.ok) return { reachable: false, error: `${response.status} ${response.statusText}` }
    const info = await response.json() as { app?: { version?: string; bundle_id?: string } }
    const version = info.app?.version
    const bundleID = info.app?.bundle_id
    const installations = await readInstallations()
    const installation = target.type === 'server' ? installations.server : installations.desktop
    const update = installation
      ? await checkInstallationUpdate({ ...installation, version: version ?? installation.version }).catch(() => undefined)
      : undefined
    return {
      reachable: true,
      version,
      bundleID,
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
