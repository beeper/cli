import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export type UpdateAvailability = {
  current: string
  latest?: string
  available: boolean
}

/**
 * Read the cached dist-tag info that @oclif/plugin-warn-if-update-available writes.
 * Synchronous-style: returns immediately from disk; never hits the network.
 * Returns undefined when the cache is missing or unreadable — caller should treat
 * that as "no banner to show".
 */
export async function readUpdateAvailability(options: { cacheDir: string; currentVersion: string; tag?: string }): Promise<UpdateAvailability | undefined> {
  try {
    const raw = await readFile(join(options.cacheDir, 'version'), 'utf8')
    const parsed = JSON.parse(raw) as Record<string, string>
    const tag = options.tag ?? 'latest'
    const latest = parsed[tag]
    if (!latest) return { current: options.currentVersion, available: false }
    const available = stripPrerelease(latest) !== stripPrerelease(options.currentVersion) && isGreater(latest, options.currentVersion)
    return { current: options.currentVersion, latest, available }
  } catch {
    return undefined
  }
}

export function formatUpdateFooter(availability: UpdateAvailability | undefined): string | undefined {
  if (!availability?.available || !availability.latest) return undefined
  return `↑ beeper-cli ${availability.latest} available — beeper update`
}

function stripPrerelease(v: string): string {
  return v.split('-')[0] ?? v
}

function isGreater(a: string, b: string): boolean {
  const aa = stripPrerelease(a).split('.').map(n => Number(n) || 0)
  const bb = stripPrerelease(b).split('.').map(n => Number(n) || 0)
  for (let i = 0; i < Math.max(aa.length, bb.length); i++) {
    const x = aa[i] ?? 0
    const y = bb[i] ?? 0
    if (x !== y) return x > y
  }
  return false
}
