import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsDisappear extends BeeperCommand {
  static override summary = 'Set disappearing messages for a chat'
  static override flags = {
    chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    pick: Flags.integer({ description: 'Pick the Nth chat when --chat is ambiguous' }),
    seconds: Flags.string({ required: true, description: 'Timer in seconds, or "off" to disable' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsDisappear)
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    const expiry = flags.seconds.toLowerCase() === 'off' ? null : Number(flags.seconds)
    if (expiry !== null && (!Number.isInteger(expiry) || expiry < 0)) throw new Error('--seconds must be a positive integer or "off"')
    await printData(await client.chats.update(chatID, { messageExpirySeconds: expiry }), flags.json ? 'json' : 'human')
  }
}
