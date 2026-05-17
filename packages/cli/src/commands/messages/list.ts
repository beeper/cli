import { Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { listMatrixMessages, shouldFallbackToMatrix } from '../../lib/matrix-direct.js'
import { collectPage, printIDs, printList } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class MessagesList extends BeeperCommand {
  static override summary = 'List chat messages'
  static override flags = {
    chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    'before-cursor': Flags.string({ description: 'Paginate messages older than this message ID' }),
    'after-cursor': Flags.string({ description: 'Paginate messages newer than this message ID' }),
    sender: Flags.string({ description: 'Filter by sender: me, others, or a specific user ID (client-side)' }),
    asc: Flags.boolean({ default: false, description: 'Order oldest first (default: newest first)' }),
    ids: Flags.boolean({ default: false, description: 'Print only message IDs' }),
    limit: Flags.integer({ default: 50, description: 'Maximum messages to print' }),
    pick: Flags.integer({ description: 'Pick the Nth chat when --chat is ambiguous' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(MessagesList)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    const before = flags['before-cursor']
    const after = flags['after-cursor']
    if (before && after) throw new Error('Use only one of --before-cursor or --after-cursor')
    let items: unknown[]
    try {
      items = await collectFiltered(client.messages.list(chatID, { cursor: before ?? after, direction: before ? 'before' : after ? 'after' : undefined }), flags.limit, flags.sender)
    } catch (error) {
      if (!shouldFallbackToMatrix(chatID, error)) throw error
      const matrixItems = await listMatrixMessages(flags, chatID, flags.limit)
      items = filterBySender(matrixItems, flags.sender)
    }
    if (flags.asc) items = [...items].reverse()
    if (flags.ids) printIDs(items)
    else await printList(items, flags.json ? 'json' : 'human', { title: 'No messages yet', subtitle: 'This chat is empty.' })
  }
}

async function collectFiltered(iterable: AsyncIterable<unknown>, limit: number, sender: string | undefined): Promise<unknown[]> {
  if (!sender) return collectPage(iterable, limit)
  const items: unknown[] = []
  for await (const item of iterable) {
    if (matchesSender(item, sender)) items.push(item)
    if (items.length >= limit) break
  }
  return items
}

function filterBySender(items: unknown[], sender: string | undefined): unknown[] {
  if (!sender) return items
  return items.filter(item => matchesSender(item, sender))
}

function matchesSender(item: unknown, sender: string): boolean {
  if (!item || typeof item !== 'object') return false
  const row = item as { isSender?: boolean; senderID?: string }
  if (sender === 'me') return row.isSender === true
  if (sender === 'others') return row.isSender !== true
  return row.senderID === sender
}
