import { Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { collectPage, printIDs, printList } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class MessagesList extends BeeperCommand {
  static override summary = 'List chat messages'
  static override flags = { chat: Flags.string({ required: true }), before: Flags.string(), after: Flags.string(), ids: Flags.boolean({ default: false }), limit: Flags.integer({ default: 50 }), pick: Flags.integer() }
  async run(): Promise<void> {
    const { flags } = await this.parse(MessagesList)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    if (flags.before && flags.after) throw new Error('Use only one of --before or --after')
    const items = await collectPage(client.messages.list(chatID, { cursor: flags.before ?? flags.after, direction: flags.before ? 'before' : flags.after ? 'after' : undefined }), flags.limit)
    if (flags.ids) printIDs(items)
    else await printList(items, flags.json ? 'json' : 'human', { title: 'No messages yet', subtitle: 'This chat is empty.' })
  }
}
