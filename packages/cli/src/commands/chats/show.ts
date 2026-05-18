import { Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { shouldFallbackToMatrix } from '../../lib/matrix-direct.js'
import { printData } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsShow extends BeeperCommand {
  static override summary = 'Show chat details'
  static override flags = { chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }), pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }), 'max-participants': Flags.integer({ description: 'Limit number of participants returned in chat details' }) }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsShow)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    try {
      await printData(await client.chats.retrieve(chatID, { maxParticipantCount: flags['max-participants'] }), flags.json ? 'json' : 'human')
    } catch (error) {
      if (!shouldFallbackToMatrix(chatID, error)) throw error
      await printData({
        accountID: 'matrix',
        id: chatID,
        network: 'Beeper',
        participants: { hasMore: false, items: [], total: 0 },
        title: chatID,
        type: 'single',
        unreadCount: 0,
      }, flags.json ? 'json' : 'human')
    }
  }
}
