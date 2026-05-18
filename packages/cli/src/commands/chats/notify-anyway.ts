import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsNotifyAnyway extends BeeperCommand {
  static override summary = 'Send an iMessage Notify Anyway alert'
  static override flags = { chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }), pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),  }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsNotifyAnyway)
    ensureWritable(flags)
    
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    await printData(await client.chats.notifyAnyway(chatID), flags.json ? 'json' : 'human')
  }
}
