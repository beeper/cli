import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsTitle extends BeeperCommand {
  static override summary = 'Set a chat title'
  static override flags = { chat: Flags.string({ required: true }), pick: Flags.integer(), title: Flags.string({ required: true }), }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsTitle)
    ensureWritable(flags)
    
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    await printData(await client.chats.update(chatID, { title: flags.title }), flags.json ? 'json' : 'human')
  }
}
