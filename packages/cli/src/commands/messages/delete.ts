import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class MessagesDelete extends BeeperCommand {
  static override summary = 'Delete a message'
  static override flags = { chat: Flags.string({ required: true }), id: Flags.string({ required: true }), pick: Flags.integer(), 'for-everyone': Flags.boolean({ default: false }), }
  async run(): Promise<void> {
    const { flags } = await this.parse(MessagesDelete)
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    await client.messages.delete(flags.id, { chatID, forEveryone: flags['for-everyone'] || undefined })
    await printSuccess({ message: flags['for-everyone'] ? 'Deleted for everyone' : 'Deleted', data: { chatID, messageID: flags.id, forEveryone: flags['for-everyone'] } }, flags.json ? 'json' : 'human')
  }
}
