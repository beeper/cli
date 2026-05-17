import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsExpiry extends BeeperCommand {
  static override summary = 'Set disappearing-message expiry'
  static override flags = { chat: Flags.string({ required: true }), pick: Flags.integer(), seconds: Flags.string({ required: true }), }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsExpiry)
    ensureWritable(flags)
    
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    const expiry = flags.seconds.toLowerCase() === 'off' ? null : Number(flags.seconds)
    if (expiry !== null && (!Number.isInteger(expiry) || expiry < 0)) throw new Error('--seconds must be a positive integer or off')
    await printData(await client.chats.update(chatID, { messageExpirySeconds: expiry }), flags.json ? 'json' : 'human')
  }
}
