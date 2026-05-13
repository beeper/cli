import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { apiCopy, cliCopy, sdkParamCopy } from '../lib/copy.js'
import { printData } from '../lib/output.js'
import { resolveChatID } from '../lib/resolve.js'

export default class Read extends Command {
  static override summary = apiCopy.chats.markRead
  static override args = {
    chat: Args.string({ description: cliCopy.args.chatSelector, required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: cliCopy.flags.baseURL }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: cliCopy.flags.json }),
    message: Flags.string({ description: sdkParamCopy.messageID }),
    pick: Flags.integer({ description: cliCopy.flags.pick }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Read)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    const result = await client.chats.markRead(chatID, { messageID: flags.message })
    printData(result, flags.json ? 'json' : 'human')
  }
}
