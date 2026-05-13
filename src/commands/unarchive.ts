import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { apiCopy, cliCopy } from '../lib/copy.js'
import { resolveChatID } from '../lib/resolve.js'

export default class Unarchive extends Command {
  static override summary = apiCopy.chats.archive
  static override args = {
    chat: Args.string({ description: cliCopy.args.chatSelector, required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: cliCopy.flags.baseURL }),
    debug: Flags.boolean({ default: false }),
    pick: Flags.integer({ description: cliCopy.flags.pick }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Unarchive)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    await client.chats.archive(chatID, { archived: false })
    this.log('Unarchived')
  }
}
