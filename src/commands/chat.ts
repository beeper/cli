import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { apiCopy, cliCopy } from '../lib/copy.js'
import { printData } from '../lib/output.js'
import { resolveChatID } from '../lib/resolve.js'

export default class Chat extends Command {
  static override summary = apiCopy.chats.retrieve
  static override args = {
    chat: Args.string({ description: cliCopy.args.chatSelector, required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: cliCopy.flags.baseURL }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: cliCopy.flags.json }),
    'max-participants': Flags.integer({ description: 'Maximum participants to return' }),
    pick: Flags.integer({ description: cliCopy.flags.pick }),
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
