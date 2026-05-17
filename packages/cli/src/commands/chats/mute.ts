import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsMute extends BeeperCommand {
  static override summary = 'Mute a chat'
  static override flags = { chat: Flags.string({ required: true }), pick: Flags.integer(), duration: Flags.string({ description: 'Mute duration, such as 8h' }), }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsMute)
    ensureWritable(flags)
    
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    await printData(await client.chats.update(chatID, { isMuted: true }), flags.json ? 'json' : 'human')
  }
}
