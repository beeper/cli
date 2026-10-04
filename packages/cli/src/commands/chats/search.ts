import { Args, Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { usageError } from '../../lib/errors.js'
import { resolveLabelID } from '../../lib/labels.js'
import { collectPage, printIDs, printList } from '../../lib/output.js'
import { resolveAccountIDs } from '../../lib/resolve.js'

export default class ChatsSearch extends BeeperCommand {
  static override summary = 'Search chats'
  static override args = { query: Args.string({ required: false, description: 'Optional search query (title, participant, or network)' }) }
  static override flags = {
    account: Flags.string({ multiple: true, description: 'Limit to Account ID, network, bridge, or account user' }),
    label: Flags.string({ description: 'Limit to a label name or ID' }),
    unread: Flags.boolean({ default: false, description: 'Only chats with unread messages' }),
    ids: Flags.boolean({ default: false, description: 'Print preferred chat selectors, using numeric local chat IDs when available' }),
    limit: Flags.integer({ default: 20, description: 'Maximum chats to print' }),
  }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(ChatsSearch)
    const client = await createClient(flags)
    if (!args.query && !flags.label && !flags.unread) {
      throw usageError('Provide a search query or at least one filter (--label or --unread).')
    }
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true })
    const labelID = flags.label ? await resolveLabelID(client, flags.label) : undefined
    const items = await collectPage(client.chats.search({ query: args.query, accountIDs, labelID, unreadOnly: flags.unread || undefined }), flags.limit)
    if (flags.ids) printIDs(items)
    else await printList(items, flags.json ? 'json' : 'human', {
      title: 'No chats matched',
      subtitle: args.query ? `Nothing found for "${args.query}".` : 'Nothing matched the selected filters.',
    })
  }
}
