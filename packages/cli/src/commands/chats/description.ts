import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsDescription extends BeeperCommand {
  static override summary = 'Set a chat description'
  static override flags = { chat: Flags.string({ required: true }), pick: Flags.integer(), description: Flags.string(), clear: Flags.boolean({ default: false }), }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsDescription)
    ensureWritable(flags)
    if (!flags.clear && !flags.description) throw new Error('Provide --description or --clear')
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    await printData(await client.chats.update(chatID, { description: flags.clear ? null : flags.description }), flags.json ? 'json' : 'human')
  }
}
