import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsRemind extends BeeperCommand {
  static override summary = 'Set a chat reminder'
  static override flags = { chat: Flags.string({ required: true }), pick: Flags.integer(), when: Flags.string({ required: true }), 'dismiss-on-message': Flags.boolean({ default: false }), }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsRemind)
    ensureWritable(flags)
    
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    await client.chats.reminders.create(chatID, { reminder: { remindAt: flags.when, dismissOnIncomingMessage: flags['dismiss-on-message'] || undefined } })
    await printSuccess({ message: 'Reminder set', detail: flags.when, data: { chatID, remindAt: flags.when } }, flags.json ? 'json' : 'human')
  }
}
