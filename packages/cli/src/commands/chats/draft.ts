import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsDraft extends BeeperCommand {
  static override summary = 'Set a chat draft'
  static override flags = { chat: Flags.string({ required: true }), pick: Flags.integer(), text: Flags.string({ required: true }), file: Flags.string(), 'file-name': Flags.string(), 'mime-type': Flags.string(), }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsDraft)
    ensureWritable(flags)
    
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    const upload = flags.file ? await client.assets.upload({ file: createReadStream(flags.file), fileName: flags['file-name'], mimeType: flags['mime-type'] }) : undefined
    await printData(await client.chats.update(chatID, { draft: { text: flags.text, attachments: upload?.uploadID ? { [upload.uploadID]: upload as any } : undefined } }), flags.json ? 'json' : 'human')
  }
}
