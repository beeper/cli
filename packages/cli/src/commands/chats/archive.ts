import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printDryRun, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsArchive extends BeeperCommand {
  static override summary = 'Archive a chat'
  static override flags = { chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }), pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),  }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsArchive)
    ensureWritable(flags)
    
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    if (flags['dry-run']) {
      await printDryRun('chats.archive', { chatID, isArchived: true }, flags.json ? 'json' : 'human')
      return
    }
    await printData(await client.chats.update(chatID, { isArchived: true }), flags.json ? 'json' : 'human')
  }
}
