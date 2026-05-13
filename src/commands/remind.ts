import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { apiCopy, cliCopy, sdkParamCopy } from '../lib/copy.js'
import { resolveChatID } from '../lib/resolve.js'

export default class Remind extends Command {
  static override summary = apiCopy.reminders.create
  static override args = {
    chat: Args.string({ description: cliCopy.args.chatSelector, required: true }),
    when: Args.string({ description: sdkParamCopy.remindAt, required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: cliCopy.flags.baseURL }),
    debug: Flags.boolean({ default: false }),
    'dismiss-on-message': Flags.boolean({ default: false, description: 'Cancel if someone messages in the chat' }),
    pick: Flags.integer({ description: cliCopy.flags.pick }),
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
