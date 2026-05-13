import { Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { apiCopy, cliCopy } from '../lib/copy.js'
import { printData } from '../lib/output.js'

export default class Accounts extends Command {
  static override summary = apiCopy.accounts.list
  static override flags = {
    'base-url': Flags.string({ description: cliCopy.flags.baseURL }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: cliCopy.flags.json }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Accounts)
    const client = await createClient(flags)
    printData(await client.accounts.list(), flags.json ? 'json' : 'human')
  }
}
