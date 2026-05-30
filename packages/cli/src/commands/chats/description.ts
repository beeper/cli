import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printDryRun } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsDescription extends BeeperCommand {
  static override summary = 'Set a chat description'
  static override flags = { chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }), pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }), description: Flags.string({ description: 'New chat description' }), clear: Flags.boolean({ default: false, description: 'Clear the existing description instead of setting one' }), }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsDescription)
    ensureWritable(flags)
    if (!flags.clear && !flags.description) throw new Error('Provide --description or --clear')
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    if (flags['dry-run']) {
      await printDryRun('chats.description', { chatID, description: flags.clear ? null : flags.description }, flags.json ? 'json' : 'human')
      return
    }
    await printData(await client.chats.update(chatID, { description: flags.clear ? null : flags.description }), flags.json ? 'json' : 'human')
  }
}
