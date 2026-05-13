import { Command, Flags } from '@oclif/core'
import { getBaseURL } from '../lib/config.js'
import { printData } from '../lib/output.js'
import { requireToken } from '../lib/client.js'

export default class CurrentUser extends Command {
  static override summary = 'Show the authenticated Desktop API user'
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(CurrentUser)
    const token = await requireToken()
    const baseURL = await getBaseURL(flags['base-url'])
    const response = await fetch(new URL('/oauth/userinfo', baseURL), {
      headers: { Authorization: `Bearer ${token}` },
    })
    const text = await response.text()
    if (!response.ok) throw new Error(text || `HTTP ${response.status}`)
    printData(JSON.parse(text) as unknown, flags.json ? 'json' : 'human')
  }
}
