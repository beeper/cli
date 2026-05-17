import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsAvatar extends BeeperCommand {
  static override summary = 'Set a chat avatar'
  static override flags = { chat: Flags.string({ required: true }), pick: Flags.integer(), file: Flags.string(), clear: Flags.boolean({ default: false }), }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsAvatar)
    ensureWritable(flags)
    if (!flags.clear && !flags.file) throw new Error('Provide --file or --clear')
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    await printData(await client.chats.update(chatID, { imgURL: flags.clear ? null : flags.file }), flags.json ? 'json' : 'human')
  }
}
