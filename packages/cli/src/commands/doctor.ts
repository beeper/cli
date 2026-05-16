import { BeeperCommand } from '../lib/command.js'
import { createClient, requireToken } from '../lib/client.js'
import { readConfig } from '../lib/config.js'
import { printData } from '../lib/output.js'
import { createInkSpinner as createSpinner } from '../lib/ink/spinner.js'

type Check = { ok: boolean; name: string; detail?: string }

export default class Doctor extends BeeperCommand {
  static override summary = 'Verify Desktop API reachability and authentication'

  async run(): Promise<void> {
    const { flags } = await this.parse(Doctor)
    const config = await readConfig()
    const baseURL = flags['base-url'] ?? config.baseURL
    const showSpinners = !flags.json && process.stderr.isTTY

    const checks: Check[] = []
    const runCheck = async <T>(name: string, label: string, action: () => Promise<T>, success?: (value: T) => string): Promise<void> => {
      const spinner = showSpinners ? createSpinner(label) : undefined
      try {
        const value = await action()
        const detail = success?.(value)
        checks.push({ ok: true, name, detail })
        if (spinner) await spinner.succeed(detail ? `${label.replace(/…$/, '')} — ${detail}` : label.replace(/…$/, ''))
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        checks.push({ ok: false, name, detail })
        if (spinner) await spinner.fail(`${label.replace(/…$/, '')} — ${detail}`)
      }
    }

    await runCheck('server', 'Checking Beeper Desktop server…', async () => {
      const response = await fetch(new URL('/v1/info', baseURL), { signal: AbortSignal.timeout(5000) })
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
      return `${response.status} ${response.statusText}`
    }, value => value)

    await runCheck('token', 'Checking auth token…', async () => {
      await requireToken()
      return process.env.BEEPER_ACCESS_TOKEN ? 'env' : 'config'
    }, value => `loaded from ${value}`)

    await runCheck('authenticated-request', 'Calling authenticated endpoint…', async () => {
      const client = await createClient({ ...flags, baseURL })
      await client.accounts.list()
      return 'ok'
    })

    const result = { ok: checks.every(check => check.ok), checks }
    if (flags.json) {
      await printData(result, 'json')
    } else {
      await printData(result, 'human')
    }
    if (!result.ok) this.exit(1)
  }
}
