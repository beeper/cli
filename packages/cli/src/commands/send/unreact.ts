import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class SendUnreact extends BeeperCommand {
  static override summary = 'Remove a reaction from a message'
  static override flags = {
    to: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    id: Flags.string({ required: true, description: 'Message ID whose reaction to remove' }),
    reaction: Flags.string({ required: true, description: 'Reaction key to remove (emoji, shortcode, or custom emoji key)' }),
    pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),
    transaction: Flags.string({ description: 'Optional transaction ID for deduplication' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(SendUnreact)
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.to, { pick: flags.pick })
    await printData(
      await client.chats.messages.reactions.delete(flags.reaction, { chatID, messageID: flags.id }),
      flags.json ? 'json' : 'human',
    )
  }
}
