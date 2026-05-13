import { Args, Command, Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { createClient } from '../lib/client.js'
import { printData } from '../lib/output.js'
import { resolveChatID } from '../lib/resolve.js'

export default class Draft extends Command {
  static override summary = 'Set a chat draft'
  static override args = {
    chat: Args.string({ description: 'Chat ID, local chat ID, title, or search text', required: true }),
    text: Args.string({ description: 'Draft text', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    file: Flags.string({ description: 'Draft attachment file' }),
    'file-name': Flags.string({ description: 'Attachment display filename' }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
    'mime-type': Flags.string({ description: 'Attachment MIME type' }),
    pick: Flags.integer({ description: 'Pick the Nth chat when the input is ambiguous' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Draft)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    const upload = flags.file
      ? await client.assets.upload({
        file: createReadStream(flags.file),
        fileName: flags['file-name'],
        mimeType: flags['mime-type'],
      })
      : undefined
    const result = await client.chats.update(chatID, {
      draft: {
        text: args.text,
        attachments: upload?.uploadID
          ? {
            [upload.uploadID]: {
              uploadID: upload.uploadID,
              duration: upload.duration,
              fileName: upload.fileName,
              mimeType: upload.mimeType,
              size: upload.width && upload.height ? { height: upload.height, width: upload.width } : undefined,
            },
          }
          : undefined,
      },
    })
    printData(result, flags.json ? 'json' : 'human')
  }
}
