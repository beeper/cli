import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { printData } from '../lib/output.js'
import { resolveChatID } from '../lib/resolve.js'

export default class Chat extends Command {
  static override summary = 'Show one chat by ID'
  static override args = {
    chat: Args.string({ description: 'Chat ID, local chat ID, title, or search text', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
    'max-participants': Flags.integer({ description: 'Maximum participants to return' }),
    pick: Flags.integer({ description: 'Pick the Nth chat when the input is ambiguous' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Chat)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    const chat = await client.chats.retrieve(chatID, {
      maxParticipantCount: flags['max-participants'],
    })
    printData(chat, flags.json ? 'json' : 'human')
  }
}
