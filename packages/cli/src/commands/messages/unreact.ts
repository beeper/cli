import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class MessagesUnreact extends BeeperCommand {
  static override summary = 'Remove a reaction'
  static override flags = { chat: Flags.string({ required: true }), id: Flags.string({ required: true }), pick: Flags.integer(), reaction: Flags.string({ required: true }), }
  async run(): Promise<void> {
    const { flags } = await this.parse(MessagesUnreact)
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    await printData(await client.chats.messages.reactions.delete(flags.reaction, { chatID, messageID: flags.id }), flags.json ? 'json' : 'human')
  }
}
