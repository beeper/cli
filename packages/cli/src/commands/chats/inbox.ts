import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsInbox extends BeeperCommand {
  static override summary = 'Move a chat to the inbox'
  static override flags = { chat: Flags.string({ required: true }), pick: Flags.integer(),  }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsInbox)
    ensureWritable(flags)
    
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    await printData(await client.chats.update(chatID, { isArchived: false, isLowPriority: false }), flags.json ? 'json' : 'human')
  }
}
