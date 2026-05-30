import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printDryRun, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsRemind extends BeeperCommand {
  static override summary = 'Set a chat reminder'
  static override examples = [
    'beeper chats remind --chat "Mom" --when 2024-12-25T09:00:00Z',
    'beeper chats remind --chat "Work" --when 2024-12-25T09:00:00Z --dismiss-on-message',
  ]
  static override flags = { chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }), pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }), when: Flags.string({ required: true, description: 'ISO timestamp when the reminder should trigger' }), 'dismiss-on-message': Flags.boolean({ default: false, description: 'Dismiss the reminder automatically when a new message arrives' }), }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsRemind)
    ensureWritable(flags)
    
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    if (flags['dry-run']) {
      await printDryRun('chats.remind', { chatID, reminder: { remindAt: flags.when, dismissOnIncomingMessage: flags['dismiss-on-message'] || undefined } }, flags.json ? 'json' : 'human')
      return
    }
    await client.chats.reminders.create(chatID, { reminder: { remindAt: flags.when, dismissOnIncomingMessage: flags['dismiss-on-message'] || undefined } })
    await printSuccess({ message: 'Reminder set', detail: flags.when, data: { chatID, remindAt: flags.when } }, flags.json ? 'json' : 'human')
  }
}
