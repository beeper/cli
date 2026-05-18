import { Flags } from '@oclif/core'
import { BeeperCommand } from '../lib/command.js'
import { createClient } from '../lib/client.js'
import { exportBeeperData } from '../lib/export/index.js'
import { resolveAccountIDs, resolveChatID } from '../lib/resolve.js'

export default class Export extends BeeperCommand {
  static override summary = 'Export accounts, chats, messages, Markdown transcripts, and attachments'
  static override description = [
    'Creates a resumable Beeper Desktop export using the official Desktop API SDK.',
    'The export directory contains accounts.json, chats.json, manifest.json, and one directory per chat with chat.json, messages.json, messages.markdown, messages.html, downloaded attachments, and checkpoint state for interrupted runs.',
  ].join('\n')

  static override flags = {
    account: Flags.string({ multiple: true, description: 'Limit to an account selector. Repeat to include more accounts.' }),
    chat: Flags.string({ multiple: true, description: 'Limit to a chat selector. Repeat to include more chats.' }),
    force: Flags.boolean({ default: false, description: 'Re-export chats even if checkpoint state says they are complete.' }),
    'limit-chats': Flags.integer({ description: 'Maximum chats to export. Intended for testing large exports.' }),
    'limit-messages': Flags.integer({ description: 'Maximum messages per chat. Intended for testing large exports.' }),
    'max-participants': Flags.integer({ default: 500, description: 'Maximum participants to include in each chat.json.' }),
    'no-attachments': Flags.boolean({ default: false, description: 'Skip downloading message attachments.' }),
    out: Flags.directory({ char: 'o', default: 'beeper-export', description: 'Export directory.' }),
    pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),
    quiet: Flags.boolean({ default: false, description: 'Suppress progress output.' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Export)
    const client = await createClient(flags)
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true })
    const chatIDs = flags.chat?.length
      ? await Promise.all(flags.chat.map(chat => resolveChatID(client, chat, { accountIDs, pick: flags.pick })))
      : undefined

    const manifest = await exportBeeperData(client, {
      accountIDs,
      chatIDs,
      downloadAttachments: !flags['no-attachments'],
      events: flags.events,
      force: flags.force,
      limitChats: flags['limit-chats'],
      limitMessages: flags['limit-messages'],
      maxParticipants: flags['max-participants'],
      outDir: flags.out,
      quiet: flags.quiet,
    })

    this.log(`Exported ${manifest.chatCount} chats, ${manifest.messageCount} messages, ${manifest.attachmentCount} attachments to ${flags.out}`)
  }
}
