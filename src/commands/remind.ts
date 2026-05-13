import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { resolveChatID } from '../lib/resolve.js'

export default class Remind extends Command {
  static override summary = 'Set a chat reminder'
  static override args = {
    chat: Args.string({ description: 'Chat ID, local chat ID, title, or search text', required: true }),
    when: Args.string({ description: 'ISO timestamp for the reminder', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    'dismiss-on-message': Flags.boolean({ default: false, description: 'Cancel if someone messages in the chat' }),
    pick: Flags.integer({ description: 'Pick the Nth chat when the input is ambiguous' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Remind)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    await client.chats.reminders.create(chatID, {
      reminder: {
        dismissOnIncomingMessage: flags['dismiss-on-message'] || undefined,
        remindAt: args.when,
      },
    })
    this.log('Reminder set')
  }
}
