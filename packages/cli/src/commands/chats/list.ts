import { Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { collectPage, printIDs, printList } from '../../lib/output.js'
import { resolveAccountIDs } from '../../lib/resolve.js'

export default class ChatsList extends BeeperCommand {
  static override summary = 'List chats'
  static override flags = { account: Flags.string({ multiple: true }), ids: Flags.boolean({ default: false }), limit: Flags.integer({ default: 20 }) }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsList)
    const client = await createClient(flags)
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true })
    const items = await collectPage(client.chats.list({ accountIDs }), flags.limit)
    if (flags.ids) printIDs(items)
    else await printList(items, flags.json ? 'json' : 'human', { title: 'No chats yet', subtitle: 'Connect an account or sync existing chats.' })
  }
}
