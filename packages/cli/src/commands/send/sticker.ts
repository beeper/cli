import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'
import { sendMessage } from '../../lib/send-message.js'

export default class SendSticker extends BeeperCommand {
  static override summary = 'Send a sticker'
  static override description = 'Uploads the file and sends as a sticker message. Defaults --mime to image/webp.'
  static override flags = {
    to: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    file: Flags.string({ required: true, description: 'Sticker file (typically 512x512 WebP)' }),
    filename: Flags.string({ description: 'Override the displayed filename' }),
    mime: Flags.string({ default: 'image/webp', description: 'MIME type for the sticker (default: image/webp)' }),
    pick: Flags.integer({ description: 'Pick the Nth chat when --to is ambiguous' }),
    'reply-to': Flags.string({ description: 'Send as a reply to this message ID' }),
    wait: Flags.boolean({ default: false, description: 'Wait for the message to leave the pending state (or fail) before returning' }),
    'wait-timeout': Flags.integer({ default: 30_000, description: 'Maximum wait time in ms when --wait is set' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(SendSticker)
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.to, { pick: flags.pick })
    await printData(
      await sendMessage(client, {
        chatID,
        file: flags.file,
        fileName: flags.filename,
        mimeType: flags.mime,
        replyTo: flags['reply-to'],
        text: '',
        attachmentType: 'sticker',
        wait: flags.wait,
        waitTimeoutMs: flags['wait-timeout'],
      }),
      flags.json ? 'json' : 'human',
    )
  }
}
