import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'
import { sendMessage } from '../../lib/send-message.js'

export default class SendFile extends BeeperCommand {
  static override summary = 'Send a file'
  static override description = 'Returns when Desktop accepts the send request. Pass `--wait` to wait until the message leaves the pending state or fails.'
  static override examples = [
    'beeper send file --to 10313 --file ./photo.jpg --caption "Look at this"',
    'beeper send file --to alice@whatsapp --file ./report.pdf',
    'beeper send file --to 8951 --file ./clip.mp4 --reply-to <msgID>',
  ]
  static override flags = {
    to: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    file: Flags.string({ required: true, description: 'Local file path to upload (max 500 MB)' }),
    caption: Flags.string({ description: 'Optional caption to send alongside the file' }),
    filename: Flags.string({ description: 'Override the displayed filename' }),
    mime: Flags.string({ description: 'Override MIME type detection' }),
    pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),
    'reply-to': Flags.string({ description: 'Send as a reply to this message ID' }),
    wait: Flags.boolean({ default: false, description: 'Wait for the message to leave the pending state (or fail) before returning' }),
    'wait-timeout': Flags.integer({ default: 30_000, description: 'Maximum wait time in ms when --wait is set' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(SendFile)
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.to, { pick: flags.pick })
    await printData(await sendMessage(client, { chatID, file: flags.file, fileName: flags.filename, mimeType: flags.mime, replyTo: flags['reply-to'], text: flags.caption || '', wait: flags.wait, waitTimeoutMs: flags['wait-timeout'] }), flags.json ? 'json' : 'human')
  }
}
