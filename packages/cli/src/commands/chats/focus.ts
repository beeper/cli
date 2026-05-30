import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printDryRun, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsFocus extends BeeperCommand {
  static override summary = 'Focus Beeper Desktop on a chat'
  static override flags = {
    chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),
    message: Flags.string({ description: 'Scroll Desktop to this message ID after focusing' }),
    draft: Flags.string({ description: 'Prefill the chat composer with this draft text' }),
    attachment: Flags.string({ description: 'Prefill the chat composer with this attachment file path' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsFocus)
    ensureWritable(flags)
    
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    if (flags['dry-run']) {
      await printDryRun('chats.focus', { chatID, messageID: flags.message, draftText: flags.draft, draftAttachmentPath: flags.attachment }, flags.json ? 'json' : 'human')
      return
    }
    await printData(await client.focus({ chatID, messageID: flags.message, draftText: flags.draft, draftAttachmentPath: flags.attachment }), flags.json ? 'json' : 'human')
  }
}
