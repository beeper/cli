import { Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { collectPage, printData } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class MessagesContext extends BeeperCommand {
  static override summary = 'Show message context'
  static override flags = { chat: Flags.string({ required: true }), id: Flags.string({ required: true }), before: Flags.integer({ default: 10 }), after: Flags.integer({ default: 10 }), pick: Flags.integer() }
  async run(): Promise<void> {
    const { flags } = await this.parse(MessagesContext)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    const before = await collectPage(client.messages.list(chatID, { cursor: flags.id, direction: 'before' }), flags.before)
    const after = await collectPage(client.messages.list(chatID, { cursor: flags.id, direction: 'after' }), flags.after)
    await printData({ chatID, messageID: flags.id, before, after }, flags.json ? 'json' : 'human')
  }
}
