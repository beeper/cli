import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class MessagesEdit extends BeeperCommand {
  static override summary = 'Edit a message'
  static override flags = { chat: Flags.string({ required: true }), id: Flags.string({ required: true }), pick: Flags.integer(), message: Flags.string({ required: true }), }
  async run(): Promise<void> {
    const { flags } = await this.parse(MessagesEdit)
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    await printData(await client.messages.update(flags.id, { chatID, text: flags.message }), flags.json ? 'json' : 'human')
  }
}
