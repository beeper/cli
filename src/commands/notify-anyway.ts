import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { apiCopy, cliCopy } from '../lib/copy.js'
import { printData } from '../lib/output.js'
import { resolveChatID } from '../lib/resolve.js'

export default class NotifyAnyway extends Command {
  static override summary = apiCopy.chats.notifyAnyway
  static override args = {
    chat: Args.string({ description: cliCopy.args.chatSelector, required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: cliCopy.flags.baseURL }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: cliCopy.flags.json }),
    pick: Flags.integer({ description: cliCopy.flags.pick }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(NotifyAnyway)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    const result = await client.chats.notifyAnyway(chatID)
    printData(result, flags.json ? 'json' : 'human')
  }
}
