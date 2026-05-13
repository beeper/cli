import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { printData } from '../lib/output.js'
import { resolveChatID } from '../lib/resolve.js'

export default class React extends Command {
  static override summary = 'Add a reaction to a message'
  static override args = {
    chat: Args.string({ description: 'Chat ID, local chat ID, title, or search text', required: true }),
    message: Args.string({ description: 'Message ID', required: true }),
    reaction: Args.string({ description: 'Reaction key, emoji, or shortcode', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
    pick: Flags.integer({ description: 'Pick the Nth chat when the input is ambiguous' }),
    transaction: Flags.string({ description: 'Optional transaction ID' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(React)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    const result = await client.chats.messages.reactions.add(args.message, {
      chatID,
      reactionKey: args.reaction,
      transactionID: flags.transaction,
    })
    printData(result, flags.json ? 'json' : 'human')
  }
}
