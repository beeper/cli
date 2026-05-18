import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class MessagesEdit extends BeeperCommand {
  static override summary = 'Edit a message'
  static override flags = {
    chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    id: Flags.string({ required: true, description: 'Message ID to edit (must be one of your own messages with no attachments)' }),
    pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),
    message: Flags.string({ required: true, description: 'New message text' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(MessagesEdit)
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    await printData(await client.messages.update(flags.id, { chatID, text: flags.message }), flags.json ? 'json' : 'human')
  }
}
