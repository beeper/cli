import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { printData } from '../lib/output.js'
import { resolveChatID } from '../lib/resolve.js'

export default class Edit extends Command {
  static override summary = 'Edit a text message'
  static override args = {
    chat: Args.string({ description: 'Chat ID, local chat ID, title, or search text', required: true }),
    message: Args.string({ description: 'Message ID', required: true }),
    text: Args.string({ description: 'New message text', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
    pick: Flags.integer({ description: 'Pick the Nth chat when the input is ambiguous' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Edit)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    const result = await client.messages.update(args.message, {
      chatID,
      text: args.text,
    })
    printData(result, flags.json ? 'json' : 'human')
  }
}
