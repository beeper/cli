import { Command, Flags } from '@oclif/core'
import { createClient, requireToken } from '../lib/client.js'
import { readConfig } from '../lib/config.js'
import { printData } from '../lib/output.js'

export default class Doctor extends Command {
  static override summary = 'Verify Desktop API reachability and authentication'
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Doctor)
    const config = await readConfig()
    const baseURL = flags['base-url'] ?? config.baseURL
    const checks: Array<{ ok: boolean; name: string; detail?: string }> = []

    try {
      const response = await fetch(new URL('/v1/info', baseURL))
      checks.push({ ok: response.ok, name: 'server', detail: `${response.status} ${response.statusText}` })
    } catch (error) {
      checks.push({ ok: false, name: 'server', detail: String(error) })
    }

    try {
      await requireToken()
      checks.push({ ok: true, name: 'token', detail: process.env.BEEPER_ACCESS_TOKEN ? 'env' : 'config' })
    } catch (error) {
      checks.push({ ok: false, name: 'token', detail: error instanceof Error ? error.message : String(error) })
    }

    try {
      const client = await createClient({ ...flags, baseURL })
      await client.accounts.list()
      checks.push({ ok: true, name: 'authenticated-request' })
    } catch (error) {
      checks.push({ ok: false, name: 'authenticated-request', detail: error instanceof Error ? error.message : String(error) })
    }

    const result = { ok: checks.every(check => check.ok), checks }
    printData(result, flags.json ? 'json' : 'human')
    if (!result.ok) this.exit(1)
  }
}
