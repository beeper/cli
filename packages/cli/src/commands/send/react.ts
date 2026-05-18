import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class SendReact extends BeeperCommand {
  static override summary = 'Send a reaction to a message'
  static override flags = {
    to: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    id: Flags.string({ required: true, description: 'Message ID to react to' }),
    reaction: Flags.string({ required: true, description: 'Reaction key (emoji, shortcode, or custom emoji key)' }),
    pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),
    transaction: Flags.string({ description: 'Optional transaction ID for deduplication' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(SendReact)
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.to, { pick: flags.pick })
    await printData(
      await client.chats.messages.reactions.add(flags.id, { chatID, reactionKey: flags.reaction, transactionID: flags.transaction }),
      flags.json ? 'json' : 'human',
    )
  }
}
