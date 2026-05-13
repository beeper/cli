import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { resolveChatID } from '../lib/resolve.js'

export default class Archive extends Command {
  static override summary = 'Archive a chat'
  static override args = {
    chat: Args.string({ description: 'Chat ID, local chat ID, title, or search text', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    pick: Flags.integer({ description: 'Pick the Nth chat when the input is ambiguous' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Archive)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    await client.chats.archive(chatID, { archived: true })
    this.log('Archived')
  }
}
