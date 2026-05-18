import { Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { cliCopy } from '../../lib/copy.js'
import { printIDs, printList } from '../../lib/output.js'
import { resolveAccountIDs } from '../../lib/resolve.js'

export default class ChatsList extends BeeperCommand {
  static override summary = 'List chats'
  static override flags = {
    account: Flags.string({ multiple: true, description: `Limit to ${cliCopy.args.accountSelector}` }),
    ids: Flags.boolean({ default: false, description: 'Print preferred chat selectors, using numeric local chat IDs when available' }),
    limit: Flags.integer({ default: 20, description: 'Maximum chats to print' }),
    archived: Flags.boolean({ allowNo: true, description: 'Only archived chats (--no-archived to exclude)' }),
    pinned: Flags.boolean({ allowNo: true, description: 'Only pinned chats (--no-pinned to exclude)' }),
    muted: Flags.boolean({ allowNo: true, description: 'Only muted chats (--no-muted to exclude)' }),
    unread: Flags.boolean({ allowNo: true, description: 'Only chats with unread messages (--no-unread to exclude)' }),
    'low-priority': Flags.boolean({ allowNo: true, description: 'Only Low Priority chats (--no-low-priority to exclude)' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsList)
    const client = await createClient(flags)
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true })

    const hasStateFilter = (
      flags.archived !== undefined || flags.pinned !== undefined
      || flags.muted !== undefined || flags.unread !== undefined
      || flags['low-priority'] !== undefined
    )

    const matchesFilters = (row: Record<string, unknown>): boolean => {
      if (!hasStateFilter) return true
      if (flags.archived !== undefined && Boolean(row.isArchived) !== flags.archived) return false
      if (flags.pinned !== undefined && Boolean(row.isPinned) !== flags.pinned) return false
      if (flags.muted !== undefined && Boolean(row.isMuted) !== flags.muted) return false
      if (flags['low-priority'] !== undefined && Boolean(row.isLowPriority) !== flags['low-priority']) return false
      if (flags.unread !== undefined) {
        const unread = Number(row.unreadCount ?? 0) > 0 || Boolean(row.isMarkedUnread)
        if (unread !== flags.unread) return false
      }
      return true
    }

    const items: Array<Record<string, unknown>> = []
    for await (const item of client.chats.list({ accountIDs })) {
      const row = item as unknown as Record<string, unknown>
      if (matchesFilters(row)) items.push(row)
      if (items.length >= flags.limit) break
    }

    if (flags.ids) printIDs(items)
    else await printList(items, flags.json ? 'json' : 'human', { title: 'No chats matched', subtitle: hasStateFilter ? 'Try relaxing the filter flags.' : 'Connect an account or sync existing chats.' })
  }
}
