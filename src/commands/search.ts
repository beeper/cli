import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { printData } from '../lib/output.js'

export default class Search extends Command {
  static override summary = 'Search chats and messages'
  static override args = {
    query: Args.string({ description: 'Literal search query', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Search)
    const client = await createClient(flags)
    const result = await client.search({ query: args.query })
    printData(result, flags.json ? 'json' : 'human')
  }
}
