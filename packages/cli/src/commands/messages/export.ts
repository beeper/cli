import { writeFile } from 'node:fs/promises'
import { Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class MessagesExport extends BeeperCommand {
  static override summary = 'Export one chat\'s messages to JSON'
  static override description = 'Lightweight per-chat JSON export. For a full export with transcripts, attachments, and multiple chats, use `beeper export`.'
  static override flags = {
    chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),
    'before-cursor': Flags.string({ description: 'Paginate messages older than this message ID' }),
    'after-cursor': Flags.string({ description: 'Paginate messages newer than this message ID' }),
    after: Flags.string({ description: 'Only messages at or after this ISO timestamp (client-side filter)' }),
    before: Flags.string({ description: 'Only messages at or before this ISO timestamp (client-side filter)' }),
    limit: Flags.integer({ description: 'Maximum messages to export' }),
    output: Flags.string({ char: 'o', default: '-', description: 'Output path; - writes JSON to stdout' }),
    asc: Flags.boolean({ default: false, description: 'Order oldest first (default: newest first)' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(MessagesExport)
    if (flags['before-cursor'] && flags['after-cursor']) throw new Error('Use only one of --before-cursor or --after-cursor')
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    const cursor = flags['before-cursor'] ?? flags['after-cursor']
    const direction = flags['before-cursor'] ? 'before' : flags['after-cursor'] ? 'after' : undefined
    const afterTs = flags.after ? Date.parse(flags.after) : undefined
    const beforeTs = flags.before ? Date.parse(flags.before) : undefined
    if (afterTs !== undefined && Number.isNaN(afterTs)) throw new Error(`--after is not a valid ISO timestamp: ${flags.after}`)
    if (beforeTs !== undefined && Number.isNaN(beforeTs)) throw new Error(`--before is not a valid ISO timestamp: ${flags.before}`)
    const items: unknown[] = []
    for await (const item of client.messages.list(chatID, { cursor, direction })) {
      const ts = Date.parse((item as { timestamp?: string }).timestamp ?? '')
      if (!Number.isNaN(ts)) {
        if (afterTs !== undefined && ts < afterTs) continue
        if (beforeTs !== undefined && ts > beforeTs) continue
      }
      items.push(item)
      if (flags.limit !== undefined && items.length >= flags.limit) break
    }
    const messages = flags.asc ? [...items].reverse() : items
    const envelope = {
      exportedAt: new Date().toISOString(),
      chatID,
      after: flags.after,
      before: flags.before,
      count: messages.length,
      messages,
    }
    const text = `${JSON.stringify(envelope, null, 2)}\n`
    if (flags.output === '-') process.stdout.write(text)
    else await writeFile(flags.output, text)
  }
}
