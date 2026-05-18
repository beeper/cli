import { Args, Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { collectPage, printIDs, printList } from '../../lib/output.js'
import { resolveAccountIDs } from '../../lib/resolve.js'

export default class ChatsSearch extends BeeperCommand {
  static override summary = 'Search chats by title or participant'
  static override args = { query: Args.string({ required: true, description: 'Search query (title, participant, or network)' }) }
  static override flags = {
    account: Flags.string({ multiple: true, description: 'Limit to Account ID, network, bridge, or account user' }),
    ids: Flags.boolean({ default: false, description: 'Print preferred chat selectors, using numeric local chat IDs when available' }),
    limit: Flags.integer({ default: 20, description: 'Maximum chats to print' }),
  }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(ChatsSearch)
    const client = await createClient(flags)
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true })
    const items = await collectPage(client.chats.search({ query: args.query, accountIDs }), flags.limit)
    if (flags.ids) printIDs(items)
    else await printList(items, flags.json ? 'json' : 'human', { title: 'No chats matched', subtitle: `Nothing found for "${args.query}".` })
  }
}
