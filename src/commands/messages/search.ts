import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../../lib/client.js'
import { collectPage, printData, printIDs } from '../../lib/output.js'
import { resolveAccountIDs, resolveChatID } from '../../lib/resolve.js'

export default class MessagesSearch extends Command {
  static override summary = 'Search messages'
  static override args = {
    query: Args.string({ description: 'Literal message search query', required: false }),
  }
  static override flags = {
    account: Flags.string({ multiple: true, description: 'Limit to account ID, network, bridge, or account user' }),
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    chat: Flags.string({ multiple: true, description: 'Limit to chat ID' }),
    debug: Flags.boolean({ default: false }),
    ids: Flags.boolean({ default: false, description: 'Print only message IDs' }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
    limit: Flags.integer({ default: 50, description: 'Maximum messages to print' }),
    sender: Flags.string({ description: 'me, others, or a user ID' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MessagesSearch)
    const client = await createClient(flags)
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true })
    const chatIDs = flags.chat?.length
      ? await Promise.all(flags.chat.map(chat => resolveChatID(client, chat, { accountIDs })))
      : undefined
    const items = await collectPage(client.messages.search({
      accountIDs,
      chatIDs,
      query: args.query,
      sender: flags.sender as 'me' | 'others' | (string & {}) | undefined,
    }), flags.limit)
    if (flags.ids) {
      printIDs(items)
      return
    }
    printData(items, flags.json ? 'json' : 'human')
  }
}
