import { Args, Command, Flags } from '@oclif/core'
import { createClient } from '../../lib/client.js'
import { apiCopy, cliCopy, sdkParamCopy } from '../../lib/copy.js'
import { collectPage, printData, printIDs } from '../../lib/output.js'
import { resolveAccountIDs } from '../../lib/resolve.js'

export default class ChatsSearch extends Command {
  static override summary = apiCopy.chats.search
  static override args = {
    query: Args.string({ description: sdkParamCopy.searchQuery, required: true }),
  }
  static override flags = {
    account: Flags.string({ multiple: true, description: `Limit to ${cliCopy.args.accountSelector}` }),
    'base-url': Flags.string({ description: cliCopy.flags.baseURL }),
    debug: Flags.boolean({ default: false }),
    ids: Flags.boolean({ default: false, description: 'Print only chat IDs' }),
    inbox: Flags.string({ options: ['primary', 'low-priority', 'archive'] }),
    json: Flags.boolean({ default: false, description: cliCopy.flags.json }),
    limit: Flags.integer({ default: 20, description: 'Maximum chats to print' }),
    scope: Flags.string({ options: ['titles', 'participants'] }),
    type: Flags.string({ options: ['single', 'group', 'any'] }),
    unread: Flags.boolean({ default: false, description: 'Only unread chats' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ChatsSearch)
    const client = await createClient(flags)
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true })
    const items = await collectPage(client.chats.search({
      accountIDs,
      inbox: flags.inbox as 'primary' | 'low-priority' | 'archive' | undefined,
      query: args.query,
      scope: flags.scope as 'titles' | 'participants' | undefined,
      type: flags.type as 'single' | 'group' | 'any' | undefined,
      unreadOnly: flags.unread || undefined,
    }), flags.limit)
    if (flags.ids) {
      printIDs(items)
      return
    }
    printData(items, flags.json ? 'json' : 'human')
  }
}
