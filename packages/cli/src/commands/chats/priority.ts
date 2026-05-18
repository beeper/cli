import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsPriority extends BeeperCommand {
  static override summary = 'Move a chat to the Inbox or Low Priority'
  static override flags = {
    chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),
    level: Flags.string({ required: true, options: ['inbox', 'low'], description: 'Destination: inbox (default mailbox) or low (Low Priority)' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsPriority)
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    const update = flags.level === 'inbox'
      ? { isArchived: false, isLowPriority: false }
      : { isLowPriority: true }
    await printData(await client.chats.update(chatID, update), flags.json ? 'json' : 'human')
  }
}
