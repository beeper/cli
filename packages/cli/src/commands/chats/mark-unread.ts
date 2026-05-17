import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsMarkUnread extends BeeperCommand {
  static override summary = 'Mark a chat unread'
  static override flags = { chat: Flags.string({ required: true }), pick: Flags.integer(), message: Flags.string(), }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsMarkUnread)
    ensureWritable(flags)
    
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    await printData(await client.chats.markUnread(chatID, { messageID: flags.message }), flags.json ? 'json' : 'human')
  }
}
