import { Command, Flags } from '@oclif/core'
import { appRequest } from '../lib/app-api.js'
import { printData } from '../lib/output.js'

export default class CurrentUser extends Command {
  static override summary = 'Show the authenticated Desktop API user'
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(CurrentUser)
    const user = await appRequest<unknown>('GET', '/oauth/userinfo', { baseURL: flags['base-url'] })
    await printData(user, flags.json ? 'json' : 'human')
  }
}
