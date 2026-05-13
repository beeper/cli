import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { printData } from '../lib/output.js'
import { resolveChatID } from '../lib/resolve.js'

export default class ClearDraft extends Command {
  static override summary = 'Clear a chat draft'
  static override args = {
    chat: Args.string({ description: 'Chat ID, local chat ID, title, or search text', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
    pick: Flags.integer({ description: 'Pick the Nth chat when the input is ambiguous' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ClearDraft)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    const result = await client.chats.update(chatID, { draft: null })
    printData(result, flags.json ? 'json' : 'human')
  }
}
