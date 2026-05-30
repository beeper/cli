import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printDryRun } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsMarkRead extends BeeperCommand {
  static override summary = 'Mark a chat as read'
  static override flags = { chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }), pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }), message: Flags.string({ description: 'Mark read at (or unread starting from) this message ID' }), }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsMarkRead)
    ensureWritable(flags)
    
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    if (flags['dry-run']) {
      await printDryRun('chats.mark-read', { chatID, messageID: flags.message }, flags.json ? 'json' : 'human')
      return
    }
    await printData(await client.chats.markRead(chatID, { messageID: flags.message }), flags.json ? 'json' : 'human')
  }
}
