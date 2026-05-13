import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../../lib/client.js'
import { apiCopy, cliCopy } from '../../lib/copy.js'
import { collectPage, printData, printIDs } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class MessagesIndex extends Command {
  static override summary = apiCopy.messages.list
  static override args = {
    chat: Args.string({ description: cliCopy.args.chatSelector, required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: cliCopy.flags.baseURL }),
    before: Flags.string({ description: 'Fetch messages before cursor' }),
    after: Flags.string({ description: 'Fetch messages after cursor' }),
    debug: Flags.boolean({ default: false }),
    ids: Flags.boolean({ default: false, description: 'Print only message IDs' }),
    json: Flags.boolean({ default: false, description: cliCopy.flags.json }),
    limit: Flags.integer({ default: 50, description: 'Maximum messages to print' }),
    pick: Flags.integer({ description: cliCopy.flags.pick }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MessagesIndex)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    const cursor = flags.before ?? flags.after
    const direction = flags.after ? 'after' : flags.before ? 'before' : undefined
    const items = await collectPage(client.messages.list(chatID, {
      cursor,
      direction,
    }), flags.limit)
    if (flags.ids) {
      printIDs(items)
      return
    }
    printData(items, flags.json ? 'json' : 'human')
  }
}
