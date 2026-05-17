import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class MessagesReact extends BeeperCommand {
  static override summary = 'React to a message'
  static override flags = { chat: Flags.string({ required: true }), id: Flags.string({ required: true }), pick: Flags.integer(), reaction: Flags.string({ required: true }), transaction: Flags.string(), }
  async run(): Promise<void> {
    const { flags } = await this.parse(MessagesReact)
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    await printData(await client.chats.messages.reactions.add(flags.id, { chatID, reactionKey: flags.reaction, transactionID: flags.transaction }), flags.json ? 'json' : 'human')
  }
}
