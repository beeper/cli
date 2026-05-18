import { Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class MessagesShow extends BeeperCommand {
  static override summary = 'Show one message'
  static override flags = {
    chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    id: Flags.string({ required: true, description: 'Message ID, pendingMessageID, or Matrix event ID' }),
    pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(MessagesShow)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    if (client.messages.retrieve) await printData(await client.messages.retrieve(flags.id, { chatID }), flags.json ? 'json' : 'human')
    else throw new Error('This Desktop API does not expose message lookup.')
  }
}
