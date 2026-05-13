import { Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { printData } from '../lib/output.js'

export default class Accounts extends Command {
  static override summary = 'List connected chat accounts'
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Accounts)
    const client = await createClient(flags)
    printData(await client.accounts.list(), flags.json ? 'json' : 'human')
  }
}
