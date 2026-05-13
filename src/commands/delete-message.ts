import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { resolveChatID } from '../lib/resolve.js'

export default class DeleteMessage extends Command {
  static override summary = 'Delete a message'
  static override args = {
    chat: Args.string({ description: 'Chat ID, local chat ID, title, or search text', required: true }),
    message: Args.string({ description: 'Message ID', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    'for-everyone': Flags.boolean({ default: false, description: 'Request deletion for everyone when supported' }),
    pick: Flags.integer({ description: 'Pick the Nth chat when the input is ambiguous' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DeleteMessage)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    await client.messages.delete(args.message, {
      chatID,
      forEveryone: flags['for-everyone'] || undefined,
    })
    this.log('Deleted')
  }
}
