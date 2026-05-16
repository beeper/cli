import { BeeperCommand } from '../lib/command.js'
import { readConfig } from '../lib/config.js'
import { printData } from '../lib/output.js'
import { withInkSpinner as withSpinner } from '../lib/ink/spinner.js'

export default class Status extends BeeperCommand {
  static override summary = 'Check Beeper Desktop API status'

  async run(): Promise<void> {
    const { flags } = await this.parse(Status)
    const config = await readConfig()
    const baseURL = flags['base-url'] ?? config.baseURL
    const fetchInfo = async (): Promise<unknown> => {
      const response = await fetch(new URL('/v1/info', baseURL), { signal: AbortSignal.timeout(5000) })
      if (!response.ok) throw new Error(`Beeper Desktop API returned ${response.status} ${response.statusText}`)
      return response.json()
    }
    const info = flags.json
      ? await fetchInfo()
      : await withSpinner(`Pinging Beeper Desktop at ${baseURL}…`, fetchInfo, {
        done: value => `Beeper Desktop v${(value as { version?: string }).version ?? '?'} reachable`,
      })
    await printData(info, flags.json ? 'json' : 'human')
  }
}
