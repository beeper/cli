import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsFocus extends BeeperCommand {
  static override summary = 'Focus Beeper Desktop'
  static override flags = { chat: Flags.string({ required: true }), pick: Flags.integer(), message: Flags.string(), draft: Flags.string(), attachment: Flags.string(), }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsFocus)
    ensureWritable(flags)
    
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    await printData(await client.focus({ chatID, messageID: flags.message, draftText: flags.draft, draftAttachmentPath: flags.attachment }), flags.json ? 'json' : 'human')
  }
}
