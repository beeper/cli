import { Args, Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { collectPage, printIDs, printList } from '../../lib/output.js'
import { resolveAccountIDs } from '../../lib/resolve.js'

export default class ChatsSearch extends BeeperCommand {
  static override summary = 'Search chats'
  static override args = { query: Args.string({ required: true }) }
  static override flags = { account: Flags.string({ multiple: true }), ids: Flags.boolean({ default: false }), limit: Flags.integer({ default: 20 }) }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(ChatsSearch)
    const client = await createClient(flags)
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true })
    const items = await collectPage(client.chats.search({ query: args.query, accountIDs }), flags.limit)
    if (flags.ids) printIDs(items)
    else await printList(items, flags.json ? 'json' : 'human', { title: 'No chats matched', subtitle: `Nothing found for "${args.query}".` })
  }
}
