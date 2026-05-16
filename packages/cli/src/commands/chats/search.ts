import { Args, Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { apiCopy, cliCopy, sdkParamCopy } from '../../lib/copy.js'
import { collectPage, printIDs, printList } from '../../lib/output.js'
import { resolveAccountIDs } from '../../lib/resolve.js'
import { withInkSpinner as withSpinner } from '../../lib/ink/spinner.js'

export default class ChatsSearch extends BeeperCommand {
  static override summary = apiCopy.chats.search
  static override args = {
    query: Args.string({ description: sdkParamCopy.searchQuery, required: true }),
  }
  static override flags = {
    account: Flags.string({ multiple: true, description: `Limit to ${cliCopy.args.accountSelector}` }),
    ids: Flags.boolean({ default: false, description: 'Print only chat IDs' }),
    inbox: Flags.string({ options: ['primary', 'low-priority', 'archive'] }),
    'include-muted': Flags.boolean({ allowNo: true, default: true, description: 'Include muted chats. Use --no-include-muted for a tighter search.' }),
    'last-activity-after': Flags.string({ description: 'Only chats with last activity after this ISO timestamp' }),
    'last-activity-before': Flags.string({ description: 'Only chats with last activity before this ISO timestamp' }),
    limit: Flags.integer({ default: 20, description: 'Maximum chats to print' }),
    scope: Flags.string({ options: ['titles', 'participants'] }),
    type: Flags.string({ options: ['single', 'group', 'any'] }),
    unread: Flags.boolean({ default: false, description: 'Only unread chats' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ChatsSearch)
    const client = await createClient(flags)
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true })
    const params = {
      accountIDs,
      inbox: flags.inbox as 'primary' | 'low-priority' | 'archive' | undefined,
      includeMuted: flags['include-muted'],
      lastActivityAfter: flags['last-activity-after'],
      lastActivityBefore: flags['last-activity-before'],
      query: args.query,
      scope: flags.scope as 'titles' | 'participants' | undefined,
      type: flags.type as 'single' | 'group' | 'any' | undefined,
      unreadOnly: flags.unread || undefined,
    }
    const useSpinner = !flags.json && !flags.ids
    const items = useSpinner
      ? await withSpinner(`Searching chats for "${args.query}"…`, () => collectPage(client.chats.search(params), flags.limit), {
        done: value => `${value.length} match${value.length === 1 ? '' : 'es'}`,
      })
      : await collectPage(client.chats.search(params), flags.limit)
    if (flags.ids) {
      printIDs(items)
      return
    }
    await printList(items, flags.json ? 'json' : 'human', {
      title: 'No chats matched',
      subtitle: `Nothing found for "${args.query}".`,
      suggestions: [
        { command: 'beeper chats', hint: 'see everything' },
        { command: 'beeper search "<term>"', hint: 'search messages too' },
        { command: 'beeper contacts <accountID> <query>', hint: 'find contacts to start a chat' },
      ],
    })
  }
}
