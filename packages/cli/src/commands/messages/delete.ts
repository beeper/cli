import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class MessagesDelete extends BeeperCommand {
  static override summary = 'Delete a message'
  static override flags = {
    chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    id: Flags.string({ required: true, description: 'Message ID to delete (final message ID; pending IDs are rejected)' }),
    pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),
    'for-everyone': Flags.boolean({ default: false, description: 'Delete for everyone when the network supports it (otherwise deletes only for you)' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(MessagesDelete)
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    await client.messages.delete(flags.id, { chatID, forEveryone: flags['for-everyone'] || undefined })
    await printSuccess({ message: flags['for-everyone'] ? 'Deleted for everyone' : 'Deleted', data: { chatID, messageID: flags.id, forEveryone: flags['for-everyone'] } }, flags.json ? 'json' : 'human')
  }
}
