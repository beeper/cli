import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../lib/command.js'
import {
  checkInstallationUpdate,
  readInstallations,
  updateServerInstallation,
  type Installation,
} from '../lib/installations.js'
import { pathSetupHint } from '../lib/env.js'
import { printData } from '../lib/output.js'
import pkg from '../../package.json' with { type: 'json' }

export default class Update extends BeeperCommand {
  static override summary = 'Check and install Beeper updates'
  static override flags = {
    cli: Flags.boolean({ default: false, description: 'Check the Beeper CLI package' }),
    desktop: Flags.boolean({ default: false, description: 'Check the CLI-owned Desktop install' }),
    server: Flags.boolean({ default: false, description: 'Check the CLI-owned Server install' }),
    check: Flags.boolean({ default: false, description: 'Only check for updates; do not install' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Update)
    if (!flags.check) ensureWritable(flags)
    const selected = flags.cli || flags.desktop || flags.server
    const installations = await readInstallations()
    const results: Array<Record<string, unknown>> = []

    if (!selected || flags.cli) {
      results.push({ kind: 'cli', ...(await checkCLI()) })
    }

    if ((!selected || flags.desktop) && installations.desktop) {
      results.push({ kind: 'desktop', ...(await checkDesktop(installations.desktop)) })
    } else if ((!selected || flags.desktop) && !installations.desktop) {
      results.push({ kind: 'desktop', installed: false, action: 'Run: beeper install desktop' })
    }

    if ((!selected || flags.server) && installations.server) {
      const check = await checkInstallationUpdate(installations.server)
      if (check.available && !flags.check) {
        const updated = await updateServerInstallation(installations.server)
        results.push({ kind: 'server', updated: true, previousVersion: installations.server.version, currentVersion: updated.version, path: updated.path, hint: pathSetupHint() })
      } else {
        results.push({ kind: 'server', ...check })
      }
    } else if ((!selected || flags.server) && !installations.server) {
      results.push({ kind: 'server', installed: false, action: 'Run: beeper install server' })
    }

    await printData(results, flags.json ? 'json' : 'human')
  }
}

async function checkDesktop(installation: Installation): Promise<Record<string, unknown>> {
  const check = await checkInstallationUpdate(installation)
  return {
    ...check,
    action: 'Update Beeper Desktop in the app.',
  }
}

async function checkCLI(): Promise<Record<string, unknown>> {
  const currentVersion = pkg.version
  try {
    const response = await fetch('https://api.github.com/repos/beeper/desktop-api-cli/releases/latest', {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'beeper-cli' },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error(`GitHub releases returned ${response.status}`)
    const latest = await response.json() as { tag_name?: string }
    const latestVersion = latest.tag_name?.replace(/^v/, '')
    return {
      currentVersion,
      latestVersion,
      available: !!latestVersion && latestVersion !== currentVersion,
      action: latestVersion && latestVersion !== currentVersion
        ? 'Update with: brew upgrade beeper/tap/beeper-cli'
        : 'beeper-cli is up to date.',
    }
  } catch (error) {
    return {
      currentVersion,
      available: false,
      action: `Could not check GitHub releases for beeper-cli updates: ${(error as Error).message}`,
    }
  }
}
