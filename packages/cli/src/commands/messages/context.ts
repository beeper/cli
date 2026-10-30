import { Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { collectPage, printData } from '../../lib/output.js'
import { resolveChatID, resolveMessageCursor } from '../../lib/resolve.js'

export default class MessagesContext extends BeeperCommand {
  static override summary = 'Show message context'
  static override flags = {
    chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    id: Flags.string({ required: true, description: 'Target message ID to center the window on (resolved to sortKey for paging)' }),
    before: Flags.integer({ default: 10, description: 'Number of messages to include before the target' }),
    after: Flags.integer({ default: 10, description: 'Number of messages to include after the target' }),
    pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(MessagesContext)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    const cursor = await resolveMessageCursor(client, chatID, flags.id)
    const before = await collectPage(client.messages.list(chatID, { cursor, direction: 'before' }), flags.before)
    const after = await collectPage(client.messages.list(chatID, { cursor, direction: 'after' }), flags.after)
    await printData({ chatID, messageID: flags.id, before, after }, flags.json ? 'json' : 'human')
  }
}
